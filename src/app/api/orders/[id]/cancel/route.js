import { pool } from '@/server/db'
import { requireAuth } from '@/server/requireAuth'
import { withErrors } from '@/server/http'
import { checkoutOrigin, getStripe } from '@/server/stripe'
import { cancelOrder } from '@/server/refunds'

export const runtime = 'nodejs'
export const POST = withErrors(async (request, context) => {
  const user = await requireAuth(request)
  if (request.headers.get('origin') !== checkoutOrigin()) {
    return Response.json({ error: 'Order cancellation must start from this site.' }, { status: 403 })
  }
  const { id } = await context.params
  const order = await cancelOrder({ db: pool, stripe: getStripe(), orderId: id, userId: user.id })
  return Response.json(order, { headers: { 'Cache-Control': 'private, no-store' } })
})
