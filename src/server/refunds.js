import { randomUUID } from 'node:crypto'
import { getOrder, isUUID } from './payments.js'

const problem = (message, status) => Object.assign(new Error(message), { status, expose: true })
const identifier = value => typeof value === 'string' ? value : value?.id
const priority = { requested: 0, pending: 1, requires_action: 1, succeeded: 2, failed: 3, canceled: 3 }

function matchesSession(session, order) {
  return session.object === 'checkout.session' && session.livemode === false && session.mode === 'payment' &&
    session.id === order.stripe_session_id && session.id.startsWith('cs_test_') &&
    session.metadata?.app === 'tamarind-and-tide' && session.metadata.orderId === order.id &&
    session.metadata.userId === order.user_id && session.client_reference_id === order.id &&
    session.amount_total === order.total_amount && session.currency === order.currency
}

// Called only with a server-authenticated Stripe response or a signed webhook.
// A Refund has no livemode property: the API client is test-only; events check
// livemode separately. Refund IDs, amounts and ownership are never browser input.
export async function applyRefund(db, refund) {
  if (refund.metadata?.app !== 'tamarind-and-tide') return
  if (refund.object !== 'refund' || !/^(re|pyr)_/.test(refund.id || '') ||
      !isUUID(refund.metadata.orderId) || !isUUID(refund.metadata.refundRequestId) ||
      !Object.hasOwn(priority, refund.status) || refund.status === 'requested') throw new Error('Invalid refund response.')
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: [order] } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [refund.metadata.orderId])
    if (!order || order.status !== 'paid' || !order.paid_at || order.user_id !== refund.metadata.userId ||
        order.refund_request_id !== refund.metadata.refundRequestId || order.total_amount !== refund.amount ||
        order.currency !== refund.currency || order.stripe_payment_intent_id !== identifier(refund.payment_intent) ||
        (order.stripe_refund_id && order.stripe_refund_id !== refund.id)) throw new Error('Refund does not match the purchase.')
    // Delayed API responses and replayed events must not erase a terminal result.
    // Stripe can report a refund failure after initially reporting success.
    if (priority[refund.status] >= priority[order.refund_status || 'requested']) {
      await client.query(`UPDATE orders SET stripe_refund_id = $2, refund_status = $3,
        cancelled_at = COALESCE(cancelled_at, NOW()),
        refunded_at = CASE WHEN $3 = 'succeeded' THEN COALESCE(refunded_at, NOW()) ELSE NULL END,
        updated_at = NOW() WHERE id = $1`, [order.id, refund.id, refund.status])
    }
    await client.query('COMMIT')
  } catch (error) { await client.query('ROLLBACK'); throw error }
  finally { client.release() }
}

export async function applyRefundEvent(db, event) {
  if (!['refund.created', 'refund.updated', 'refund.failed'].includes(event.type)) return
  if (event.data.object.metadata?.app !== 'tamarind-and-tide') return
  if (event.livemode !== false) throw new Error('Live refund events are not accepted.')
  await applyRefund(db, event.data.object)
}

async function cancelUnpaid(db, stripe, order) {
  if (!order.stripe_session_id) throw problem('Checkout is still opening. Please try cancelling again in a moment.', 409)
  let session
  try {
    session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
    if (!matchesSession(session, order)) throw new Error('Checkout does not match the order.')
    if (session.status === 'open') session = await stripe.checkout.sessions.expire(session.id)
  } catch (error) {
    // Another cancellation may have expired it between retrieve and expire.
    // A timed-out expiration might also have succeeded at Stripe.
    try { session = await stripe.checkout.sessions.retrieve(order.stripe_session_id) } catch { session = null }
    if (!session || !matchesSession(session, order) || session.status !== 'expired') {
      console.error('Checkout cancellation failed:', error.type || 'StripeError')
      throw problem('Could not close checkout. Refresh the order and try again; cancellation is not confirmed.', 502)
    }
  }
  if (!matchesSession(session, order) || session.status !== 'expired' || session.payment_status !== 'unpaid') {
    throw problem('Payment is already completing. Refresh the order, wait for payment confirmation, then request a refund.', 409)
  }
  const result = await db.query(`UPDATE orders SET status = 'cancelled', cancelled_at = COALESCE(cancelled_at, NOW()),
    checkout_url = NULL, updated_at = NOW() WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'expired')
    AND stripe_session_id = $3 RETURNING id`, [order.id, order.user_id, session.id])
  if (!result.rowCount) {
    const latest = await getOrder(db, order.id, order.user_id)
    if (latest.status !== 'cancelled') throw problem('The payment status changed. Refresh this order before cancelling.', 409)
  }
}

async function refundPaid(db, stripe, orderId, userId) {
  // Claim a single full refund under a row lock, then release the connection
  // before calling Stripe. Every retry uses this same server-generated key.
  const client = await db.connect()
  let order
  try {
    await client.query('BEGIN')
    ;({ rows: [order] } = await client.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE', [orderId, userId]))
    if (!order || order.status !== 'paid' || !order.paid_at || !order.stripe_payment_intent_id?.startsWith('pi_')) {
      throw problem('Payment is not confirmed yet. Refresh this order before requesting a refund.', 409)
    }
    if (!order.refund_request_id) {
      ;({ rows: [order] } = await client.query(`UPDATE orders SET refund_request_id = $2, refund_status = 'requested',
        refund_requested_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`, [order.id, randomUUID()]))
    }
    await client.query('COMMIT')
  } catch (error) { await client.query('ROLLBACK'); throw error }
  finally { client.release() }

  if (['succeeded', 'failed', 'canceled'].includes(order.refund_status)) return
  let refund
  try {
    if (order.stripe_refund_id) refund = await stripe.refunds.retrieve(order.stripe_refund_id)
    else {
      // Also recover a response lost more than 24h ago, after Stripe may have
      // discarded its idempotency cache. Never create a second refund blindly.
      const previous = await stripe.refunds.list({ payment_intent: order.stripe_payment_intent_id, limit: 100 })
      refund = previous.data.find(item => item.metadata?.refundRequestId === order.refund_request_id)
      if (!refund && previous.has_more) throw new Error('Refund history needs manual review.')
      if (!refund) refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id, amount: order.total_amount, reason: 'requested_by_customer',
        metadata: { app: 'tamarind-and-tide', orderId: order.id, userId: order.user_id, refundRequestId: order.refund_request_id },
      }, { idempotencyKey: `refund-${order.refund_request_id}` })
    }
  } catch (error) {
    console.error('Stripe refund request failed:', error.type || 'StripeError')
    throw problem('Your refund request is saved, but Stripe has not confirmed it. Use “Check refund” to retry safely. If it keeps failing, contact the restaurant.', 502)
  }
  await applyRefund(db, refund)
}

export async function cancelOrder({ db, stripe, orderId, userId }) {
  if (!isUUID(orderId)) throw problem('Order not found.', 404)
  const { rows: [order] } = await db.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId])
  if (!order) throw problem('Order not found.', 404)
  if (order.status === 'pending') await cancelUnpaid(db, stripe, order)
  else if (order.status === 'paid') await refundPaid(db, stripe, orderId, userId)
  return getOrder(db, orderId, userId)
}
