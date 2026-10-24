import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// Seatings that can be booked. Must match `seatings` in client/src/data/tables.js
// ('8:00 pm' is missing on purpose: it's shown as full there).
const OPEN_SEATINGS = ['12:30 pm', '1:45 pm', '7:00 pm', '9:15 pm']

// '2026-10-23' -> true. Also rejects impossible dates like 2026-02-31.
function isValidDate(text) {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && new Date(text).toISOString().startsWith(text)
}

// Today's date at the restaurant (India time) as 'YYYY-MM-DD'. The client uses the same rule.
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

// GET /api/bookings/taken?date=2026-10-23&seating=7:00 pm
// Public: which tables are already booked. Returns only table ids, never
// who booked them.
router.get('/taken', async (req, res) => {
  const { date, seating } = req.query
  if (!isValidDate(date) || !OPEN_SEATINGS.includes(seating)) {
    return res.status(400).json({ error: 'Send a valid date and seating.' })
  }

  const { rows } = await pool.query('SELECT table_id FROM bookings WHERE booking_date = $1 AND seating = $2', [
    date,
    seating,
  ])
  res.json({ taken: rows.map((row) => row.table_id) })
})

// GET /api/bookings/mine  ->  the signed-in user's upcoming bookings
// LEFT JOIN keeps bookings that have no thali; SUM adds up the pre-order.
router.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT b.id, b.table_id AS "tableId", to_char(b.booking_date, 'YYYY-MM-DD') AS date,
            b.seating, b.guests,
            COALESCE(SUM(i.qty), 0)::int           AS plates,
            COALESCE(SUM(i.qty * d.price), 0)::int AS total
     FROM bookings b
     LEFT JOIN booking_items i ON i.booking_id = b.id
     LEFT JOIN dishes d        ON d.id = i.dish_id
     WHERE b.user_id = $1 AND b.booking_date >= $2
     GROUP BY b.id
     ORDER BY b.booking_date, b.created_at`,
    [req.user.id, today()],
  )
  res.json(rows)
})

// POST /api/bookings  ->  make a booking (signed-in users only)
// Body: { tableId, date, seating, guests, name, phone, occasion, notes,
//         items: [{ dishId, qty }] }
router.post('/', requireAuth, async (req, res) => {
  const { tableId, date, seating, guests, occasion, notes } = req.body
  const name = String(req.body.name ?? '').trim()
  const phone = String(req.body.phone ?? '').trim()
  const items = Array.isArray(req.body.items) ? req.body.items : []

  // Never trust the browser: check everything again here.
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' })
  if (!isValidDate(date) || date < today()) return res.status(400).json({ error: 'Pick a date from today onwards.' })
  if (!OPEN_SEATINGS.includes(seating)) return res.status(400).json({ error: 'That seating is not available.' })
  if (!Number.isInteger(guests) || guests < 1 || guests > 6) {
    return res.status(400).json({ error: 'Guests must be between 1 and 6.' })
  }
  if (!items.every((item) => Number.isInteger(item.dishId) && Number.isInteger(item.qty) && item.qty > 0)) {
    return res.status(400).json({ error: 'The thali pre-order is not valid.' })
  }

  const { rows: found } = await pool.query('SELECT seats FROM dining_tables WHERE id = $1', [tableId])
  if (found.length === 0) return res.status(400).json({ error: 'That table does not exist.' })
  if (found[0].seats < guests) return res.status(400).json({ error: 'That table is too small for your party.' })

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
      [req.user.id, tableId, date, seating, guests, name, phone, occasion || null, notes || null],
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
    res.status(201).json(booking)
  } catch (err) {
    await client.query('ROLLBACK')
    // Postgres error codes: 23505 = UNIQUE broken (table already booked),
    // 23503 = FOREIGN KEY broken (a dish id that doesn't exist).
    if (err.code === '23505') return res.status(409).json({ error: 'Sorry, someone just booked that table. Pick another.' })
    if (err.code === '23503') return res.status(400).json({ error: 'One of those dishes is no longer on the menu.' })
    throw err // anything else: let the error handler in index.js send a 500
  } finally {
    client.release() // give the connection back to the pool
  }
})

// DELETE /api/bookings/:id  ->  cancel one of YOUR bookings.
// `AND user_id = $2` means you can't cancel someone else's, even if you guess the id.
router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Booking not found.' })

  const { rowCount } = await pool.query('DELETE FROM bookings WHERE id = $1 AND user_id = $2', [id, req.user.id])
  if (rowCount === 0) return res.status(404).json({ error: 'Booking not found.' })
  res.status(204).end()
})

export default router
