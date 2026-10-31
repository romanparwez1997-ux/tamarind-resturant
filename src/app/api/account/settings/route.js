import { requireAuth } from '@/server/requireAuth'
import { withErrors } from '@/server/http'
import { emailDeliveryReady } from '@/server/mail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const GET = withErrors(async request => {
  await requireAuth(request)
  return Response.json({ emailDeliveryReady: emailDeliveryReady() }, { headers: { 'Cache-Control': 'private, no-store' } })
})
