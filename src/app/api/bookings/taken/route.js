import { pool } from '@/server/db'
import { withErrors } from '@/server/http'
import { OPEN_SEATINGS, isValidDate } from '@/server/bookingValidation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withErrors(async (request) => {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const seating = searchParams.get('seating')
  if (!isValidDate(date) || !OPEN_SEATINGS.includes(seating)) {
    return Response.json({ error: 'Send a valid date and seating.' }, { status: 400 })
  }

  const { rows } = await pool.query('SELECT table_id FROM bookings WHERE booking_date = $1 AND seating = $2', [
    date,
    seating,
  ])
  return Response.json({ taken: rows.map((row) => row.table_id) })
})
