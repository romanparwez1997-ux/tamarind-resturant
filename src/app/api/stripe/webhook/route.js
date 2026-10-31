import { pool } from '@/server/db'
import { withErrors } from '@/server/http'
import { getStripe } from '@/server/stripe'
import { stripeWebhook } from '@/server/stripeWebhook'

export const runtime = 'nodejs'
export const POST = withErrors(async (request) => stripeWebhook(request, {
  stripe: getStripe(), db: pool, secret: process.env.STRIPE_WEBHOOK_SECRET,
}))
