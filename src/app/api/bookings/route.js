import { pool } from '@/server/db'
import { withErrors, readJson } from '@/server/http'
import { requireAuth } from '@/server/requireAuth'
import { OPEN_SEATINGS, isValidDate, today } from '@/server/bookingValidation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = withErrors(async (request) => {
  const user = await requireAuth(request)
  const body = await readJson(request)
  const { tableId, date, seating, guests, occasion, notes } = body
  const name = String(body.name ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const items = Array.isArray(body.items) ? body.items : []

  // Never trust the browser: check everything again here.
  if (!name || !phone) return Response.json({ error: 'Name and phone are required.' }, { status: 400 })
  if (!isValidDate(date) || date < today()) return Response.json({ error: 'Pick a date from today onwards.' }, { status: 400 })
  if (!OPEN_SEATINGS.includes(seating)) return Response.json({ error: 'That seating is not available.' }, { status: 400 })
  if (!Number.isInteger(guests) || guests < 1 || guests > 6) {
    return Response.json({ error: 'Guests must be between 1 and 6.' }, { status: 400 })
  }
  if (!items.every((item) => Number.isInteger(item?.dishId) && Number.isInteger(item.qty) && item.qty > 0)) {
    return Response.json({ error: 'The thali pre-order is not valid.' }, { status: 400 })
  }

  const { rows: found } = await pool.query('SELECT seats FROM dining_tables WHERE id = $1', [tableId])
  if (found.length === 0) return Response.json({ error: 'That table does not exist.' }, { status: 400 })
  if (found[0].seats < guests) return Response.json({ error: 'That table is too small for your party.' }, { status: 400 })

  // A booking and its thali items are saved together in a TRANSACTION:
  // either every INSERT succeeds (COMMIT) or none of them are kept (ROLLBACK).
  // All queries in a transaction must use the same connection, so we borrow one.
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO bookings (user_id, table_id, booking_date, seating, guests, name, phone, occasion, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, table_id AS "tableId", to_char(booking_date, 'YYYY-MM-DD') AS date, seating, guests`,
      [user.id, tableId, date, seating, guests, name, phone, occasion || null, notes || null],
    )
    const booking = rows[0]

    for (const item of items) {
      await client.query('INSERT INTO booking_items (booking_id, dish_id, qty) VALUES ($1, $2, $3)', [
        booking.id,
        item.dishId,
        item.qty,
      ])
    }

    await client.query('COMMIT')
    return Response.json(booking, { status: 201 })
  } catch (err) {
    await client.query('ROLLBACK')
    // Postgres error codes: 23505 = UNIQUE broken (table already booked),
    // 23503 = FOREIGN KEY broken (a dish id that doesn't exist).
    if (err.code === '23505') return Response.json({ error: 'Sorry, someone just booked that table. Pick another.' }, { status: 409 })
    if (err.code === '23503') return Response.json({ error: 'One of those dishes is no longer on the menu.' }, { status: 400 })
    throw err // anything else: let withErrors send a safe 500
  } finally {
    client.release() // give the connection back to the pool
  }
})
