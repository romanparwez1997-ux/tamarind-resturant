// Run against a running app: npm run test:smoke. Reads data; creates no users or bookings.
import assert from 'node:assert/strict'
const base = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function check(path, status, options) {
  const response = await fetch(new URL(path, base), options)
  assert.equal(response.status, status, `${path}: expected ${status}, received ${response.status}`)
  return response
}

const page = await check('/', 200)
const html = await page.text()
assert.match(html, /Tamarind/)
assert.match(html, /Follow your appetite/)
for (const path of ['/api/dishes', '/api/tables']) {
  const response = await check(path, 200)
  const rows = await response.json()
  assert.ok(Array.isArray(rows) && rows.length > 0, `${path}: data missing`)
  if (path === '/api/dishes') {
    for (const cuisine of ['indian', 'continental', 'chinese', 'italian']) assert.ok(rows.some(dish => dish.cuisine === cuisine), `Missing ${cuisine} dishes`)
    assert.ok(rows.length >= 30, 'The expanded catalogue is missing dishes')
  }
}
const health = await (await check('/api/health', 200)).json()
assert.equal(health.ok, true)
assert.equal(await (await check('/api/auth/get-session', 200)).json(), null)
for (const path of ['/api/bookings/mine', '/api/bookings/1']) {
  await check(path, 401, path.endsWith('/1') ? { method: 'DELETE' } : undefined)
}
await check('/api/bookings', 401, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"userId":"spoofed"}' })
for (const date of ['2026-02-31', '9999-99-99', '']) {
  await check(`/api/bookings/taken?date=${date}&seating=7%3A00%20pm`, 400)
}
const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
const availability = await (await check(`/api/bookings/taken?date=${date}&seating=7%3A00%20pm`, 200)).json()
assert.ok(Array.isArray(availability.taken))
assert.deepEqual(await (await check('/api/does-not-exist', 404)).json(), { error: 'Not found' })
for (const path of ['/api/checkout', '/api/orders', '/api/account/settings', '/api/orders/00000000-0000-4000-8000-000000000000']) {
  await check(path, 401, path === '/api/checkout' ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' } : undefined)
}
await check('/api/orders/00000000-0000-4000-8000-000000000000/cancel', 401, { method: 'POST' })
for (const path of ['/account', '/sign-in', '/reservations']) await check(path, 200)
const signInHtml = await (await check('/sign-in', 200)).text()
assert.match(signInHtml, /Good to have/)
assert.match(signInHtml, /method="post"/)
await check('/checkout/success?order_id=00000000-0000-4000-8000-000000000000', 200)
await check('/checkout/cancel?order_id=00000000-0000-4000-8000-000000000000', 200)
await check('/checkout?order_id=00000000-0000-4000-8000-000000000000&service=dinner', 200)
assert.match(await (await check('/checkout', 200)).text(), /Your leaf is waiting/)
for (const path of ['/checkout/success', '/checkout/cancel']) {
  const html = await (await check(path, 200)).text()
  assert.match(html, /This link is missing an order ID/)
}
await check('/api/stripe/webhook', health.payments.testKeyConfigured && health.payments.webhookConfigured ? 400 : 503, { method: 'POST', body: '{}' })
console.log('Passed: rendered page, menu, tables, health, auth session, protected routes, validation, availability and JSON 404.')
