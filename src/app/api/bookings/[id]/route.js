import { pool } from '@/server/db'
import { withErrors } from '@/server/http'
import { requireAuth } from '@/server/requireAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const DELETE = withErrors(async (request, context) => {
  const user = await requireAuth(request)
  const id = Number((await context.params).id)
  if (!Number.isInteger(id)) return Response.json({ error: 'Booking not found.' }, { status: 404 })

  const { rowCount } = await pool.query('DELETE FROM bookings WHERE id = $1 AND user_id = $2', [id, user.id])
  if (rowCount === 0) return Response.json({ error: 'Booking not found.' }, { status: 404 })
  return new Response(null, { status: 204 })
})
