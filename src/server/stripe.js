import Stripe from 'stripe'

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || ''
  // The assignment always uses fake money, including on the deployed site.
  if (!/^(sk|rk)_test_/.test(key)) {
    throw Object.assign(new Error('Test checkout is not configured yet. Please try again later.'), { status: 503, expose: true })
  }
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 15000 })
}

export function checkoutOrigin() {
  const url = new URL(process.env.BETTER_AUTH_URL)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new Error('BETTER_AUTH_URL must use HTTPS outside localhost.')
  }
  // Redirects use a trusted server setting, never the request Host header.
  return url.origin
}
