import { pool } from '@/server/db'
import { withErrors } from '@/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withErrors(async () => {
  const { rows } = await pool.query('SELECT id, seats, zone, x, y FROM dining_tables ORDER BY id')
  return Response.json(rows)
})
