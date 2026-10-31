import { randomUUID } from 'node:crypto'

export const isUUID = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
const problem = (message, status = 400) => Object.assign(new Error(message), { status, expose: true })

export function checkoutItems(body) {
  if (!isUUID(body.checkoutKey)) throw problem('Send a valid checkout attempt ID.')
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    throw problem('Choose between 1 and 50 dishes.')
  }
  const seen = new Set()
  const items = body.items.map((item) => {
    if (!Number.isSafeInteger(item?.dishId) || item.dishId < 1 || item.dishId > 2147483647 ||
        !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 9 || seen.has(item.dishId)) {
      throw problem('Choose each dish once, with 1 to 9 plates.')
    }
    seen.add(item.dishId)
    // Deliberately discard any browser-supplied name, price, total or user ID.
    return { dishId: item.dishId, qty: item.qty }
  })
  return items.sort((a, b) => a.dishId - b.dishId)
}

async function pendingOrder(db, userId, checkoutKey, items) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    let { rows: [order] } = await client.query(
      'SELECT * FROM orders WHERE user_id = $1 AND checkout_key = $2 FOR UPDATE', [userId, checkoutKey],
    )
    if (!order) {
      const { rows: dishes } = await client.query('SELECT id, name, price FROM dishes WHERE id = ANY($1::int[]) FOR SHARE', [items.map((item) => item.dishId)])
      if (dishes.length !== items.length) throw problem('One of those dishes is no longer on the menu.')
      const snapshots = items.map((item) => {
        const dish = dishes.find((dish) => dish.id === item.dishId)
        return { ...item, name: dish.name, unitAmount: dish.price * 100 }
      })
      const total = snapshots.reduce((sum, item) => sum + item.unitAmount * item.qty, 0)
      if (!Number.isSafeInteger(total) || total < 1 || total > 99999999) throw problem('The order total is too large.')
      const inserted = await client.query(
        `INSERT INTO orders (id, user_id, checkout_key, total_amount)
         VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, checkout_key) DO NOTHING RETURNING *`,
        [randomUUID(), userId, checkoutKey, total],
      )
      order = inserted.rows[0]
      if (order) {
        for (const item of snapshots) {
          await client.query('INSERT INTO order_items (order_id, dish_id, dish_name, unit_amount, qty) VALUES ($1, $2, $3, $4, $5)',
            [order.id, item.dishId, item.name, item.unitAmount, item.qty])
        }
      } else {
        // A simultaneous retry may have inserted this attempt while we read prices.
        ;({ rows: [order] } = await client.query('SELECT * FROM orders WHERE user_id = $1 AND checkout_key = $2 FOR UPDATE', [userId, checkoutKey]))
      }
    }
    const { rows: savedItems } = await client.query('SELECT dish_id, dish_name, unit_amount, qty FROM order_items WHERE order_id = $1 ORDER BY dish_id', [order.id])
    if (JSON.stringify(items) !== JSON.stringify(savedItems.map((item) => ({ dishId: item.dish_id, qty: item.qty })))) {
      throw problem('This checkout attempt belongs to a different thali. Start a new order.', 409)
    }
    if (order.status !== 'pending') throw problem(order.status === 'paid' ? 'This order has already been paid.' : 'This checkout has closed. Start a new order.', 409)
    if (!order.stripe_session_id && Date.now() - new Date(order.created_at).getTime() > 23 * 60 * 60 * 1000) {
      throw problem('This checkout attempt is too old. Start a new order.', 409)
    }
    await client.query('COMMIT')
    return { order, items: savedItems }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function createCheckout({ db, stripe, user, body, origin }) {
  const items = checkoutItems(body)
  const saved = await pendingOrder(db, user.id, body.checkoutKey, items)
  const { order } = saved
  if (order.checkout_url) return { orderId: order.id, url: order.checkout_url }

  // Don't hold a database connection/transaction open during a Stripe network call.
  // Repeating a timed-out request uses this order's same Stripe idempotency key.
  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Stripe's current API selects eligible methods from Dashboard settings.
      // The legacy payment_method_types parameter is no longer accepted.
      client_reference_id: order.id,
      metadata: { app: 'tamarind-and-tide', orderId: order.id, userId: user.id },
      payment_intent_data: { metadata: { app: 'tamarind-and-tide', orderId: order.id, userId: user.id } },
      line_items: saved.items.map((item) => ({
        price_data: { currency: order.currency, unit_amount: item.unit_amount, product_data: { name: item.dish_name } },
        quantity: item.qty,
      })),
      success_url: `${origin}/checkout/success?order_id=${order.id}`,
      cancel_url: `${origin}/checkout/cancel?order_id=${order.id}`,
    }, { idempotencyKey: `order-${order.id}` })
  } catch (error) {
    console.error('Stripe Checkout creation failed:', error.type || 'StripeError')
    if (error.type === 'StripeIdempotencyError') {
      // Stripe remembers the original request, including rejected legacy
      // parameters. A changed payload needs a fresh browser checkout attempt.
      throw problem('Checkout settings changed. Please try again to start a new order.', 409)
    }
    throw problem('Could not open checkout. Please retry; your order has not been marked paid.', 502)
  }
  if (session.livemode !== false || !session.url || !session.id?.startsWith('cs_test_')) throw new Error('Expected a test-mode Checkout Session.')
  const result = await db.query(
    `UPDATE orders SET stripe_session_id = $2, checkout_url = $3, updated_at = NOW()
     WHERE id = $1 AND (stripe_session_id IS NULL OR stripe_session_id = $2) RETURNING id`,
    [order.id, session.id, session.url],
  )
  if (!result.rowCount) throw new Error('Checkout session does not match the saved order.')
  return { orderId: order.id, url: session.url }
}

export async function getOrder(db, orderId, userId) {
  if (!isUUID(orderId)) throw problem('Order not found.', 404)
  const { rows: [order] } = await db.query(
    `SELECT id, status, currency, total_amount AS "totalAmount", paid_at AS "paidAt", created_at AS "createdAt",
            cancelled_at AS "cancelledAt", refund_status AS "refundStatus", refund_requested_at AS "refundRequestedAt",
            refunded_at AS "refundedAt", stripe_refund_id AS "refundId",
            CASE WHEN status = 'pending' THEN checkout_url ELSE NULL END AS "checkoutUrl"
     FROM orders WHERE id = $1 AND user_id = $2`, [orderId, userId],
  )
  if (!order) throw problem('Order not found.', 404)
  const { rows: items } = await db.query(
    `SELECT dish_id AS "dishId", dish_name AS name, unit_amount AS "unitAmount", qty
     FROM order_items WHERE order_id = $1 ORDER BY dish_id`, [order.id],
  )
  return { ...order, items }
}

// Called ONLY after the webhook route has verified Stripe's signature.
// No redirect, lookup, checkout response or browser action can mark an order paid.
export async function applyCheckoutEvent(db, event) {
  if (event.type === 'payment_intent.payment_failed') return recordPaymentFailure(db, event)
  const paidEvent = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)
  const expiredEvent = event.type === 'checkout.session.expired'
  if (!paidEvent && !expiredEvent) return
  const session = event.data.object
  if (session.metadata?.app !== 'tamarind-and-tide') return
  if (event.livemode !== false || session.livemode !== false) throw new Error('Live payment events are not accepted.')
  if (paidEvent && session.payment_status !== 'paid') return
  if (typeof session.id !== 'string' || !session.id.startsWith('cs_test_') || session.object !== 'checkout.session' || session.mode !== 'payment' || !isUUID(session.metadata.orderId) ||
      session.client_reference_id !== session.metadata.orderId || (paidEvent && (session.status !== 'complete' || !(typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id)?.startsWith('pi_'))) ||
      (expiredEvent && session.status !== 'expired')) throw new Error('Invalid Checkout Session event.')

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: [order] } = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [session.metadata.orderId])
    if (!order || order.user_id !== session.metadata.userId || order.currency !== session.currency ||
        order.total_amount !== session.amount_total || (order.stripe_session_id && order.stripe_session_id !== session.id)) {
      throw new Error('Webhook order, owner, amount, currency or session does not match.')
    }
    if (paidEvent && order.status === 'cancelled') throw new Error('A cancelled Checkout Session cannot become paid.')
    const intentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
    if (paidEvent && order.stripe_payment_intent_id && order.stripe_payment_intent_id !== intentId) throw new Error('PaymentIntent does not match the order.')
    if (paidEvent && order.status !== 'paid') {
      // A late paid event takes precedence over expiration; duplicates are a no-op.
      // Matching metadata also handles a webhook arriving before checkout saved its session ID.
      await client.query(
        `UPDATE orders SET status = 'paid', stripe_session_id = $2, stripe_payment_intent_id = $3,
         paid_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [order.id, session.id, typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null],
      )
    } else if (expiredEvent && order.status === 'pending') {
      await client.query("UPDATE orders SET status = 'expired', stripe_session_id = $2, updated_at = NOW() WHERE id = $1", [order.id, session.id])
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error // 500 lets Stripe retry; don't acknowledge a failed database write.
  } finally {
    client.release()
  }
}

async function recordPaymentFailure(db, event) {
  const intent = event.data.object
  if (intent.metadata?.app !== 'tamarind-and-tide') return
  if (event.livemode !== false || intent.livemode !== false || intent.object !== 'payment_intent' ||
      !intent.id?.startsWith('pi_') || !isUUID(intent.metadata.orderId) ||
      intent.status !== 'requires_payment_method' || !Number.isSafeInteger(event.created) || event.created < 1) {
    throw new Error('Invalid failed-payment event.')
  }
  const code = /^[a-z_]{1,64}$/.test(intent.last_payment_error?.code || '') ? intent.last_payment_error.code : 'payment_failed'
  const { rows: [order] } = await db.query('SELECT user_id, currency, total_amount, stripe_payment_intent_id FROM orders WHERE id = $1', [intent.metadata.orderId])
  if (!order || order.user_id !== intent.metadata.userId || order.currency !== intent.currency || order.total_amount !== intent.amount ||
      (order.stripe_payment_intent_id && order.stripe_payment_intent_id !== intent.id)) throw new Error('Failed payment does not match the order.')
  await db.query(`UPDATE orders SET last_payment_error_code = $2, last_payment_failed_at = to_timestamp($3),
    stripe_payment_intent_id = $4, updated_at = NOW()
    WHERE id = $1 AND status = 'pending' AND (stripe_payment_intent_id IS NULL OR stripe_payment_intent_id = $4)
    AND (last_payment_failed_at IS NULL OR last_payment_failed_at <= to_timestamp($3))`,
  [intent.metadata.orderId, code, event.created, intent.id])
}

export async function listOrders(db, userId, { page = 1, status = 'all' } = {}) {
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !['all', 'paid', 'pending', 'unsuccessful', 'cancelled', 'refunds'].includes(status)) throw problem('Choose a valid order filter.')
  const { rows } = await db.query(`SELECT o.id, o.status, o.currency, o.total_amount AS "totalAmount", o.created_at AS "createdAt",
    o.paid_at AS "paidAt", o.last_payment_error_code AS "paymentError", o.last_payment_failed_at AS "paymentFailedAt",
    o.cancelled_at AS "cancelledAt", o.refund_status AS "refundStatus", o.refund_requested_at AS "refundRequestedAt",
    o.refunded_at AS "refundedAt", o.stripe_refund_id AS "refundId",
    COALESCE(json_agg(json_build_object('dishId', i.dish_id, 'name', i.dish_name, 'unitAmount', i.unit_amount, 'qty', i.qty) ORDER BY i.dish_id)
      FILTER (WHERE i.dish_id IS NOT NULL), '[]') AS items
    FROM orders o LEFT JOIN order_items i ON i.order_id = o.id WHERE o.user_id = $1 AND
    ($2 = 'all' OR ($2 = 'paid' AND o.status = 'paid' AND o.refund_status IS NULL)
      OR ($2 = 'cancelled' AND o.status = 'cancelled') OR ($2 = 'refunds' AND o.refund_status IS NOT NULL)
      OR ($2 = 'pending' AND o.status = 'pending' AND o.last_payment_failed_at IS NULL)
      OR ($2 = 'unsuccessful' AND (o.status = 'expired' OR (o.status = 'pending' AND o.last_payment_failed_at IS NOT NULL))))
    GROUP BY o.id ORDER BY o.created_at DESC, o.id DESC LIMIT 13 OFFSET $3`, [userId, status, (page - 1) * 12])
  return { orders: rows.slice(0, 12), hasMore: rows.length > 12, page }
}
