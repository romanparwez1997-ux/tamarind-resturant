import test from 'node:test'
import assert from 'node:assert/strict'
import Stripe from 'stripe'
import { randomUUID } from 'node:crypto'
import { checkoutItems } from '../src/server/payments.js'
import { stripeWebhook } from '../src/server/stripeWebhook.js'

const stripe = new Stripe('sk_test_signature_tests_only')
const secret = 'whsec_signature_tests_only'
const noDatabase = { connect() { throw new Error('Invalid events must not reach the database') } }
const payload = JSON.stringify({ id: 'evt_test', type: 'unrelated.event', livemode: false, data: { object: {} } })
function request(body, signature) {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST', body, headers: signature ? { 'stripe-signature': signature } : {},
  })
}

test('checkout only trusts bounded dish IDs and quantities, never browser prices or identity', () => {
  assert.deepEqual(checkoutItems({ checkoutKey: randomUUID(), userId: 'someone-else', total: 1,
    items: [{ dishId: 2, qty: 3, price: 1 }, { dishId: 1, qty: 1, name: 'Fake' }] }),
  [{ dishId: 1, qty: 1 }, { dishId: 2, qty: 3 }])
  for (const items of [undefined, [], [null], [{ dishId: 1, qty: 0 }], [{ dishId: 1, qty: 10 }],
    [{ dishId: 1, qty: 1.5 }], [{ dishId: '1', qty: 1 }], [{ dishId: 1, qty: 1 }, { dishId: 1, qty: 1 }],
    [{ dishId: 2147483648, qty: 1 }], Array.from({ length: 51 }, (_, id) => ({ dishId: id + 1, qty: 1 }))]) {
    assert.throws(() => checkoutItems({ checkoutKey: randomUUID(), items }), { status: 400 })
  }
  assert.throws(() => checkoutItems({ checkoutKey: 'invalid', items: [{ dishId: 1, qty: 1 }] }), { status: 400 })
})

test('webhook verifies exact raw bytes, signature secret and timestamp before processing', async () => {
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret })
  const valid = await stripeWebhook(request(payload, signature), { stripe, secret, db: noDatabase })
  assert.equal(valid.status, 200)
  for (const [body, header] of [
    [payload, undefined],
    [payload + ' ', signature],
    [payload, stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_wrong' })],
    [payload, stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: Math.floor(Date.now() / 1000) - 600 })],
  ]) {
    assert.equal((await stripeWebhook(request(body, header), { stripe, secret, db: noDatabase })).status, 400)
  }
  assert.equal((await stripeWebhook(request(payload, signature), { stripe, secret: '', db: noDatabase })).status, 503)
})
