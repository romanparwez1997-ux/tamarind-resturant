import { pool } from '@/server/db'
import { requireAuth } from '@/server/requireAuth'
import { withErrors } from '@/server/http'
import { getOrder } from '@/server/payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const GET = withErrors(async (request, context) => {
  const user = await requireAuth(request)
  const { id } = await context.params
  return Response.json(await getOrder(pool, id, user.id), { headers: { 'Cache-Control': 'private, no-store' } })
})
