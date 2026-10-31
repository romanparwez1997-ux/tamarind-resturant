// Isolated DB fixtures; real Stripe signatures, mocked Stripe network calls.
import '../db/env.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID, randomInt } from 'node:crypto'
import Stripe from 'stripe'
import { createCheckout, getOrder, listOrders } from '../src/server/payments.js'
import { cancelOrder } from '../src/server/refunds.js'
import { stripeWebhook } from '../src/server/stripeWebhook.js'

const { pool } = await import('../src/server/db.js')
const signatureStripe = new Stripe('sk_test_refund_signatures_only')
const secret = 'whsec_refund_signatures_only'

async function deliver(object, type, overrides = {}) {
  const payload = JSON.stringify({ id: `evt_${randomUUID()}`, type, livemode: false, data: { object }, ...overrides })
  return stripeWebhook(new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: payload,
    headers: { 'stripe-signature': signatureStripe.webhooks.generateTestHeaderString({ payload, secret }) },
  }), { stripe: signatureStripe, secret, db: pool })
}

function stripeMock() {
  const sessions = new Map(), refunds = new Map(), calls = []
  const mock = { sessions, savedRefunds: refunds, calls, timeoutOnce: false, beforeReturn: null,
    checkout: { sessions: {
      async create(params) {
        const session = { id: `cs_test_${randomUUID()}`, object: 'checkout.session', livemode: false, mode: 'payment',
          status: 'open', payment_status: 'unpaid', client_reference_id: params.client_reference_id, metadata: params.metadata,
          currency: 'inr', amount_total: params.line_items.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0),
          payment_intent: `pi_${randomUUID()}`, url: 'https://checkout.stripe.com/test_refund_fixture' }
        sessions.set(session.id, session); return session
      },
      async retrieve(id) { return { ...sessions.get(id) } },
      async expire(id) {
        const session = sessions.get(id)
        if (session.status !== 'open') throw new Error('Session is not open')
        session.status = 'expired'; return { ...session }
      },
    } },
    refunds: {
      async list({ payment_intent }) { return { data: [...refunds.values()].filter(value => value.payment_intent === payment_intent), has_more: false } },
      async retrieve(id) { return [...refunds.values()].find(value => value.id === id) },
      async create(params, options) {
        calls.push({ params, options })
        let refund = refunds.get(options.idempotencyKey)
        if (!refund) {
          refund = { id: `re_${randomUUID()}`, object: 'refund', status: 'pending', currency: 'inr',
            amount: params.amount, payment_intent: params.payment_intent, metadata: params.metadata }
          refunds.set(options.idempotencyKey, refund)
        }
        if (mock.beforeReturn) await mock.beforeReturn(refund)
        if (mock.timeoutOnce) { mock.timeoutOnce = false; throw Object.assign(new Error('Response lost'), { type: 'StripeConnectionError' }) }
        return refund
      },
    },
  }
  return mock
}

await test('cancellation and refunds protect ownership, payment history and retries', async () => {
  const user = { id: `refund-test-${randomUUID()}` }, other = { id: `refund-test-${randomUUID()}` }
  const dishId = randomInt(1000000, 2000000000)
  const stripe = stripeMock()
  async function make(paid = false) {
    const result = await createCheckout({ db: pool, stripe, user, origin: 'http://localhost:3000',
      body: { checkoutKey: randomUUID(), items: [{ dishId, qty: 2 }] } })
    const session = [...stripe.sessions.values()].find(session => session.metadata.orderId === result.orderId)
    if (paid) {
      session.status = 'complete'; session.payment_status = 'paid'
      await deliver(session, 'checkout.session.completed')
    }
    return { id: result.orderId, session }
  }
  const cancel = id => cancelOrder({ db: pool, stripe, orderId: id, userId: user.id })
  try {
    for (const fixture of [user, other]) await pool.query('INSERT INTO "user" (id, name, email) VALUES ($1, $2, $3)', [fixture.id, 'Refund Test Fixture', `${fixture.id}@example.invalid`])
    await pool.query(`INSERT INTO dishes (id, name, course, service, veg, price, description, spice)
      VALUES ($1, 'Refund Test Dish', 'mains', 'both', true, 123, 'Disposable refund fixture', 0)`, [dishId])
    const unpaid = await make()
    await assert.rejects(cancelOrder({ db: pool, stripe, orderId: unpaid.id, userId: other.id }), { status: 404 })
    await assert.rejects(cancel('invalid'), { status: 404 })
    const cancellations = await Promise.all([cancel(unpaid.id), cancel(unpaid.id)])
    assert(cancellations.every(order => order.status === 'cancelled'))
    assert.equal(stripe.sessions.get(unpaid.session.id).status, 'expired')
    assert.equal((await cancel(unpaid.id)).checkoutUrl, null)
    assert.equal((await getOrder(pool, unpaid.id, user.id)).paidAt, null)
    await deliver({ ...unpaid.session, status: 'expired' }, 'checkout.session.expired')
    assert.equal((await getOrder(pool, unpaid.id, user.id)).status, 'cancelled')
    await assert.rejects(deliver({ ...unpaid.session, status: 'complete', payment_status: 'paid' }, 'checkout.session.completed'))
    assert.equal(stripe.calls.length, 0, 'unpaid cancellations never issue refunds')

    const racing = await make()
    racing.session.status = 'complete'; racing.session.payment_status = 'paid'
    await assert.rejects(cancel(racing.id), { status: 409 }, 'completion beats session expiration; await the paid webhook')
    assert.equal((await getOrder(pool, racing.id, user.id)).status, 'pending')
    await deliver(racing.session, 'checkout.session.completed')

    const paid = await make(true)
    const paidAt = (await getOrder(pool, paid.id, user.id)).paidAt.toISOString()
    const results = await Promise.all([cancel(paid.id), cancel(paid.id)])
    assert(results.every(order => order.refundStatus === 'pending'))
    assert.equal(stripe.savedRefunds.size, 1, 'a concurrent cancellation creates only one refund')
    const refund = [...stripe.savedRefunds.values()][0]
    assert.equal(refund.amount, 24600, 'refund uses the original saved amount')
    assert.equal(refund.payment_intent, paid.session.payment_intent)
    assert.equal((await getOrder(pool, paid.id, user.id)).paidAt.toISOString(), paidAt)
    assert.equal((await listOrders(pool, user.id, { status: 'cancelled' })).orders[0].id, unpaid.id)
    assert.equal((await listOrders(pool, user.id, { status: 'refunds' })).orders[0].id, paid.id)
    assert(!(await listOrders(pool, user.id, { status: 'paid' })).orders.some(order => order.id === paid.id))
    for (const mismatch of [{ amount: 1 }, { currency: 'usd' }, { payment_intent: 'pi_other' },
      { id: 're_other' }, { metadata: { ...refund.metadata, userId: other.id } },
      { metadata: { ...refund.metadata, refundRequestId: randomUUID() } }]) {
      await assert.rejects(deliver({ ...refund, ...mismatch, status: 'succeeded' }, 'refund.updated'))
      assert.equal((await getOrder(pool, paid.id, user.id)).refundStatus, 'pending')
    }
    await assert.rejects(deliver(refund, 'refund.created', { livemode: true }))
    await deliver({ ...refund, status: 'succeeded' }, 'refund.updated')
    const refundedAt = (await getOrder(pool, paid.id, user.id)).refundedAt.toISOString()
    await deliver(refund, 'refund.created')
    await deliver(paid.session, 'checkout.session.completed')
    assert.equal((await getOrder(pool, paid.id, user.id)).refundStatus, 'succeeded', 'late pending/payment events cannot erase a refund')
    assert.equal((await cancel(paid.id)).refundedAt.toISOString(), refundedAt)
    await deliver({ ...refund, status: 'failed' }, 'refund.failed')
    await deliver({ ...refund, status: 'succeeded' }, 'refund.updated')
    assert.equal((await cancel(paid.id)).refundStatus, 'failed', 'late success cannot hide a reported refund failure')
    assert.equal((await getOrder(pool, paid.id, user.id)).refundedAt, null)

    const lost = await make(true)
    stripe.timeoutOnce = true
    await assert.rejects(cancel(lost.id), { status: 502 })
    assert.equal((await getOrder(pool, lost.id, user.id)).refundStatus, 'requested')
    const callsBeforeRetry = stripe.calls.length
    assert.equal((await cancel(lost.id)).refundStatus, 'pending')
    assert.equal(stripe.calls.length, callsBeforeRetry, 'lost responses recover via Stripe refund history, without reissuing')

    const early = await make(true)
    stripe.beforeReturn = refund => deliver({ ...refund, status: 'succeeded' }, 'refund.created')
    assert.equal((await cancel(early.id)).refundStatus, 'succeeded', 'webhook may arrive before the API response')
    assert.equal((await getOrder(pool, early.id, user.id)).totalAmount, 24600)
    assert.equal((await listOrders(pool, other.id)).orders.length, 0)
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM bookings WHERE user_id = $1', [user.id])).rows[0].count, 0)
  } finally {
    await pool.query('DELETE FROM orders WHERE user_id = $1', [user.id])
    await pool.query('DELETE FROM dishes WHERE id = $1', [dishId])
    await pool.query('DELETE FROM "user" WHERE id = ANY($1::text[])', [[user.id, other.id]])
    await pool.end()
  }
})
