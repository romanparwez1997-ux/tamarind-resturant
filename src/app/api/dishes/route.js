import { pool } from '@/server/db'
import { withErrors } from '@/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withErrors(async () => {
  const { rows } = await pool.query(
    `SELECT id, name, course, service, veg, price, description, spice,
            chefs_pick AS "chefsPick", tag, cuisine
     FROM dishes
     ORDER BY id`,
  )
  return Response.json(rows)
})
