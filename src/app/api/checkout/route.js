import { pool } from '@/server/db'
import { requireAuth } from '@/server/requireAuth'
import { withErrors, readJson } from '@/server/http'
import { getStripe, checkoutOrigin } from '@/server/stripe'
import { createCheckout } from '@/server/payments'

export const runtime = 'nodejs'
export const POST = withErrors(async (request) => {
  const user = await requireAuth(request)
  const origin = checkoutOrigin()
  if (request.headers.get('origin') !== origin) {
    return Response.json({ error: 'Checkout must start from this site.' }, { status: 403 })
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) {
    return Response.json({ error: 'Test checkout is not configured yet. Please try again later.' }, { status: 503 })
  }
  const body = await readJson(request)
  const result = await createCheckout({ db: pool, stripe: getStripe(), user, body, origin })
  return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } })
})
