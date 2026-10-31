import { pool } from '@/server/db'
import { withErrors } from '@/server/http'
import { requireAuth } from '@/server/requireAuth'
import { today } from '@/server/bookingValidation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withErrors(async (request) => {
  const user = await requireAuth(request)
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
    [user.id, today()],
  )
  return Response.json(rows)
})
