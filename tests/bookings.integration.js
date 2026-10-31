// HTTP integration against the running local app. Only disposable fixture users
// and their temporary reservations are created and removed; no messages are sent.
import '../db/env.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { pool } from '../src/server/db.js'

const base = process.env.TEST_BASE_URL || 'http://localhost:3000'
await test('table reservations enforce availability, capacity and ownership without creating payment orders', async () => {
  const fixtureIds = []
  async function request(path, { body, cookie = '', method = body ? 'POST' : 'GET' } = {}) {
    return fetch(new URL(path, base), { method, signal: AbortSignal.timeout(20000),
      headers: { Origin: base, Cookie: cookie, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) })
  }
  async function signup() {
    const suffix = randomUUID()
    const response = await request('/api/auth/sign-up/email', { body: {
      name: 'Disposable Booking Fixture', email: `booking-test-${suffix}@example.invalid`, password: `fixture-only-${randomUUID()}`,
    } })
    assert.equal(response.status, 200)
    const data = await response.json()
    fixtureIds.push(data.user.id)
    return { id: data.user.id, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') }
  }
  try {
    const owner = await signup()
    const other = await signup()
    const date = new Date(Date.now() + 120 * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const seating = '7:00 pm'
    const tables = await (await request('/api/tables')).json()
    const initial = await (await request(`/api/bookings/taken?${new URLSearchParams({ date, seating })}`)).json()
    const table = tables.find(table => table.seats === 2 && !initial.taken.includes(table.id))
    assert.ok(table, 'An available two-seat fixture table is needed')
    const body = { tableId: table.id, date, seating, guests: 2, name: 'Disposable Booking Fixture',
      phone: '5550100300', occasion: 'Birthday', notes: 'Disposable integration test', items: [], userId: other.id }
    assert.equal((await request('/api/bookings', { body: { ...body, guests: 6 }, cookie: owner.cookie })).status, 400)
    const responses = await Promise.all([request('/api/bookings', { body, cookie: owner.cookie }), request('/api/bookings', { body, cookie: owner.cookie })])
    assert.deepEqual(responses.map(response => response.status).sort(), [201, 409], 'a table cannot be double-booked')
    const saved = await responses.find(response => response.status === 201).json()
    assert.equal(saved.tableId, table.id)
    const mine = await (await request('/api/bookings/mine', { cookie: owner.cookie })).json()
    assert.ok(mine.some(booking => booking.id === saved.id))
    const theirs = await (await request('/api/bookings/mine', { cookie: other.cookie })).json()
    assert.ok(!theirs.some(booking => booking.id === saved.id))
    assert.equal((await request(`/api/bookings/${saved.id}`, { method: 'DELETE', cookie: other.cookie })).status, 404)
    const after = await (await request(`/api/bookings/taken?${new URLSearchParams({ date, seating })}`)).json()
    assert.ok(after.taken.includes(table.id))
    const { rows: [booking] } = await pool.query('SELECT user_id, occasion FROM bookings WHERE id = $1', [saved.id])
    assert.equal(booking.user_id, owner.id, 'the browser cannot spoof the owner')
    assert.equal(booking.occasion, 'Birthday')
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM orders WHERE user_id = $1', [owner.id])).rows[0].count, 0, 'free reservations do not create payment orders')
    assert.equal((await request(`/api/bookings/${saved.id}`, { method: 'DELETE', cookie: owner.cookie })).status, 204)
    const final = await (await request(`/api/bookings/taken?${new URLSearchParams({ date, seating })}`)).json()
    assert.ok(!final.taken.includes(table.id))
  } finally {
    await pool.query('DELETE FROM bookings WHERE user_id = ANY($1::text[])', [fixtureIds])
    await pool.query('DELETE FROM "user" WHERE id = ANY($1::text[])', [fixtureIds])
    await pool.end()
  }
})
