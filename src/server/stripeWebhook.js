import { applyCheckoutEvent } from './payments.js'
import { applyRefundEvent } from './refunds.js'

// Dependencies are injected so tests can sign real SDK webhook payloads without API calls.
export async function stripeWebhook(request, { stripe, db, secret }) {
  if (!secret) return Response.json({ error: 'Webhook is not configured.' }, { status: 503 })
  const signature = request.headers.get('stripe-signature')
  if (!signature) return Response.json({ error: 'Missing Stripe signature.' }, { status: 400 })
  let event
  try {
    // Read the untouched body. Parsing JSON before verification breaks the signature.
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret)
  } catch {
    return Response.json({ error: 'Invalid Stripe signature.' }, { status: 400 })
  }
  await applyCheckoutEvent(db, event)
  await applyRefundEvent(db, event)
  return Response.json({ received: true })
}
