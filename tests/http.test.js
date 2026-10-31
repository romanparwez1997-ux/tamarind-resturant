import test from 'node:test'
import assert from 'node:assert/strict'
import { readJson, withErrors } from '../src/server/http.js'
import { isValidDate } from '../src/server/bookingValidation.js'

test('dates reject missing, malformed and impossible values without throwing', () => {
  for (const value of [undefined, null, '', '2026-02-31', '2026-13-01', '2026-00-01', '2026-1-01', '9999-99-99']) {
    assert.equal(isValidDate(value), false, String(value))
  }
  assert.equal(isValidDate('2028-02-29'), true)
  assert.equal(isValidDate('2026-10-25'), true)
})

test('JSON requests require an object and return a safe 400 for invalid bodies', async () => {
  const handler = withErrors(async (request) => Response.json(await readJson(request)))
  for (const body of ['{', 'null', '[]', '42', '"text"', '']) {
    const response = await handler(new Request('http://localhost/api/bookings', { method: 'POST', body }))
    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'Send a valid JSON object.' })
  }
  const response = await handler(new Request('http://localhost/api/bookings', { method: 'POST', body: '{"guests":2}' }))
  assert.deepEqual(await response.json(), { guests: 2 })
})

test('auth errors keep their JSON status', async () => {
  const response = await withErrors(() => {
    throw Object.assign(new Error('Please sign in first.'), { status: 401 })
  })()
  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: 'Please sign in first.' })
})

test('public payment setup and retry errors retain their status without exposing internal failures', async (t) => {
  for (const [status, message] of [[503, 'Test checkout is not configured yet.'], [502, 'Could not open checkout. Please retry.']]) {
    const response = await withErrors(() => {
      throw Object.assign(new Error(message), { status, expose: true })
    })()
    assert.equal(response.status, status)
    assert.deepEqual(await response.json(), { error: message })
  }
  t.mock.method(console, 'error', () => {})
  const response = await withErrors(() => {
    throw Object.assign(new Error('Private database connection details'), { status: 503 })
  })()
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: 'Something went wrong on the server.' })
})
