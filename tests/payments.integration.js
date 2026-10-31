// Creates isolated fixtures in the configured database and removes ONLY those fixtures.
// Stripe API calls are mocked; signatures are generated and verified by the real SDK.
import '../db/env.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID, randomInt } from 'node:crypto'
import Stripe from 'stripe'
import { pool } from '../src/server/db.js'
import { createCheckout, getOrder, listOrders } from '../src/server/payments.js'
import { stripeWebhook } from '../src/server/stripeWebhook.js'

const signatureStripe = new Stripe('sk_test_integration_signatures_only')
const secret = 'whsec_integration_signatures_only'

async function deliver(session, type = 'checkout.session.completed', eventOverrides = {}) {
  const payload = JSON.stringify({ id: `evt_${randomUUID()}`, type, livemode: false, data: { object: session }, ...eventOverrides })
  const signature = signatureStripe.webhooks.generateTestHeaderString({ payload, secret })
  return stripeWebhook(new Request('http://localhost/api/stripe/webhook', {
    method: 'POST', body: payload, headers: { 'stripe-signature': signature },
  }), { stripe: signatureStripe, db: pool, secret })
}

function checkoutMock({ beforeReturn, timeoutOnce = false } = {}) {
  const sessions = new Map()
  const calls = []
  return {
    calls,
    sessions,
    checkout: { sessions: { async create(params, options) {
      calls.push({ params, options })
      let session = sessions.get(options.idempotencyKey)
      if (!session) {
        session = { id: `cs_test_fixture_${randomUUID()}`, object: 'checkout.session', livemode: false,
          mode: 'payment', status: 'open', payment_status: 'unpaid', currency: 'inr',
          metadata: params.metadata, client_reference_id: params.client_reference_id,
          amount_total: params.line_items.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0),
          payment_intent: `pi_fixture_${randomUUID()}`, url: 'https://checkout.stripe.com/c/pay/test_fixture' }
        sessions.set(options.idempotencyKey, session)
      }
      if (beforeReturn) await beforeReturn(session)
      if (timeoutOnce && calls.length === 1) throw Object.assign(new Error('Test timeout'), { type: 'StripeConnectionError' })
      return session
    } } },
  }
}

await test('database-backed checkout and signed webhooks preserve payment invariants', async () => {
  const user = { id: `payment-test-${randomUUID()}` }
  const otherUser = { id: `payment-test-${randomUUID()}` }
  const dishId = randomInt(1000000, 2000000000)
  const origin = 'http://localhost:3000'
  const makeCheckout = (stripe, checkoutKey = randomUUID(), qty = 2) => createCheckout({
    db: pool, stripe, user, origin, body: { checkoutKey, items: [{ dishId, qty, price: 1 }], total: 1, userId: otherUser.id },
  })
  try {
    for (const fixture of [user, otherUser]) {
      await pool.query('INSERT INTO "user" (id, name, email) VALUES ($1, $2, $3)', [fixture.id, 'Payment Test Fixture', `${fixture.id}@example.invalid`])
    }
    await pool.query(`INSERT INTO dishes (id, name, course, service, veg, price, description, spice)
      VALUES ($1, 'Payment Test Dish', 'mains', 'both', true, 123, 'Temporary test fixture', 0)`, [dishId])

    const stripe = checkoutMock()
    const key = randomUUID()
    const result = await makeCheckout(stripe, key)
    let order = await getOrder(pool, result.orderId, user.id)
    assert.equal(order.status, 'pending')
    assert.equal(order.totalAmount, 24600)
    assert.equal(order.items[0].unitAmount, 12300)
    assert.equal(stripe.calls[0].params.client_reference_id, order.id)
    assert.equal(stripe.calls[0].params.metadata.userId, user.id)
    assert.deepEqual(stripe.calls[0].params.payment_intent_data.metadata, stripe.calls[0].params.metadata)
    assert.equal(stripe.calls[0].params.success_url, `${origin}/checkout/success?order_id=${order.id}`)
    assert.deepEqual(await makeCheckout(stripe, key), result)
    assert.equal(stripe.calls.length, 1)
    await assert.rejects(makeCheckout(stripe, key, 3), { status: 409 })
    await assert.rejects(getOrder(pool, order.id, otherUser.id), { status: 404 })
    await assert.rejects(getOrder(pool, 'invalid', user.id), { status: 404 })
    assert.equal((await getOrder(pool, order.id, user.id)).status, 'pending', 'lookup cannot mark paid')

    const session = [...stripe.sessions.values()][0]
    const failed = { id: session.payment_intent, object: 'payment_intent', livemode: false,
      status: 'requires_payment_method', metadata: session.metadata, currency: 'inr', amount: 24600,
      last_payment_error: { code: 'card_declined' } }
    const created = Math.floor(Date.now() / 1000)
    await assert.rejects(deliver({ ...failed, amount: 1 }, 'payment_intent.payment_failed', { created }))
    await assert.rejects(deliver({ ...failed, metadata: { ...failed.metadata, userId: otherUser.id } }, 'payment_intent.payment_failed', { created }))
    await deliver(failed, 'payment_intent.payment_failed', { created })
    assert.equal((await getOrder(pool, order.id, user.id)).status, 'pending', 'failed attempts remain retryable')
    const unsuccessful = await listOrders(pool, user.id, { status: 'unsuccessful' })
    assert.equal(unsuccessful.orders[0].id, order.id)
    assert.equal(unsuccessful.orders[0].paymentError, 'card_declined')
    assert.equal((await listOrders(pool, otherUser.id)).orders.length, 0, 'history cannot expose another user’s orders')
    assert.equal((await listOrders(pool, user.id, { status: 'pending' })).orders.length, 0)
    await assert.rejects(listOrders(pool, user.id, { status: 'invalid' }), { status: 400 })
    await assert.rejects(listOrders(pool, user.id, { page: -1 }), { status: 400 })
    const paid = { ...session, status: 'complete', payment_status: 'paid' }
    for (const mismatch of [{ amount_total: 1 }, { currency: 'usd' }, { id: 'cs_test_wrong' },
      { metadata: { ...session.metadata, userId: otherUser.id } }, { client_reference_id: randomUUID() },
      { livemode: true }, { status: 'open' }]) {
      await assert.rejects(deliver({ ...paid, ...mismatch }))
      assert.equal((await getOrder(pool, order.id, user.id)).status, 'pending')
    }
    await deliver({ ...session, status: 'complete' })
    assert.equal((await getOrder(pool, order.id, user.id)).status, 'pending', 'completed but unpaid is not paid')
    await deliver({ ...session, status: 'expired' }, 'checkout.session.expired')
    assert.equal((await getOrder(pool, order.id, user.id)).status, 'expired')
    await Promise.all([deliver(paid), deliver(paid)])
    order = await getOrder(pool, order.id, user.id)
    assert.equal(order.status, 'paid')
    await deliver(failed, 'payment_intent.payment_failed', { created: created + 1 })
    assert.equal((await getOrder(pool, order.id, user.id)).status, 'paid', 'late failed events cannot undo payment')
    assert.equal((await listOrders(pool, user.id, { status: 'unsuccessful' })).orders.length, 0)
    assert.equal((await listOrders(pool, user.id, { status: 'paid' })).orders[0].id, order.id)
    const paidAt = order.paidAt.toISOString()
    await deliver(paid)
    await deliver({ ...session, status: 'expired' }, 'checkout.session.expired')
    assert.equal((await getOrder(pool, order.id, user.id)).paidAt.toISOString(), paidAt)
    assert.equal((await getOrder(pool, order.id, user.id)).checkoutUrl, null)
    await assert.rejects(makeCheckout(stripe, key), { status: 409 })

    const earlyStripe = checkoutMock({ beforeReturn: (session) => deliver({ ...session, status: 'complete', payment_status: 'paid' }) })
    const early = await makeCheckout(earlyStripe)
    assert.equal((await getOrder(pool, early.orderId, user.id)).status, 'paid', 'webhook before session persistence works')

    const retryStripe = checkoutMock({ timeoutOnce: true })
    const retryKey = randomUUID()
    await assert.rejects(makeCheckout(retryStripe, retryKey), { status: 502 })
    await pool.query('UPDATE dishes SET price = 321, name = $2 WHERE id = $1', [dishId, 'Changed Test Dish'])
    const retried = await makeCheckout(retryStripe, retryKey)
    assert.equal((await getOrder(pool, retried.orderId, user.id)).totalAmount, 24600, 'retry retains purchase snapshot')
    assert.equal(retryStripe.calls[1].params.line_items[0].price_data.product_data.name, 'Payment Test Dish')
    assert.deepEqual(retryStripe.calls[0], retryStripe.calls[1], 'Stripe idempotency parameters remain stable')
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM orders WHERE user_id = $1 AND checkout_key = $2', [user.id, retryKey])).rows[0].count, 1)

    const incompatibleStripe = { checkout: { sessions: { async create() {
      throw Object.assign(new Error('Previously used with different parameters'), { type: 'StripeIdempotencyError' })
    } } } }
    await assert.rejects(makeCheckout(incompatibleStripe), { status: 409 }, 'changed Stripe parameters require a new browser attempt rather than an endless retry')

    const concurrentKey = randomUUID()
    const concurrentStripe = checkoutMock()
    const concurrent = await Promise.all([makeCheckout(concurrentStripe, concurrentKey), makeCheckout(concurrentStripe, concurrentKey)])
    assert.equal(concurrent[0].orderId, concurrent[1].orderId)
    assert.equal(concurrentStripe.sessions.size, 1)
    assert.equal((await getOrder(pool, result.orderId, user.id)).totalAmount, 24600, 'later menu changes cannot rewrite a receipt')

    await assert.rejects(createCheckout({ db: pool, stripe, user, origin,
      body: { checkoutKey: randomUUID(), items: [{ dishId: 2147483647, qty: 1 }] } }), { status: 400 })
  } finally {
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [user.id])
    await pool.query('DELETE FROM orders WHERE user_id = $1', [user.id])
    await pool.query('DELETE FROM dishes WHERE id = $1', [dishId])
    await pool.query('DELETE FROM "user" WHERE id = ANY($1::text[])', [[user.id, otherUser.id]])
    await pool.end()
  }
})
