import { pool } from '@/server/db'
import { requireAuth } from '@/server/requireAuth'
import { withErrors } from '@/server/http'
import { listOrders } from '@/server/payments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const GET = withErrors(async request => {
  const user = await requireAuth(request)
  const params = new URL(request.url).searchParams
  const result = await listOrders(pool, user.id, { page: Number(params.get('page') || 1), status: params.get('status') || 'all' })
  return Response.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
})
