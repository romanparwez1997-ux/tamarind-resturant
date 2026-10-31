// Local assessment helper: run the official CLI with the app's test key.
// Secrets stay in the environment / git-ignored .env.local, never in arguments.
import '../db/env.js'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createInterface } from 'node:readline'
import { readFileSync, writeFileSync } from 'node:fs'

const key = process.env.STRIPE_SECRET_KEY || ''
if (!/^(sk|rk)_test_/.test(key)) {
  console.error('Add your Stripe test secret key to STRIPE_SECRET_KEY in .env.local, then run npm run stripe:listen again.')
  process.exit(1)
}

const origin = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000')
if (origin.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(origin.hostname)) {
  console.error('This helper is for localhost only. Configure a Dashboard webhook for a deployed site.')
  process.exit(1)
}

const require = createRequire(import.meta.url)
const cli = require.resolve('@stripe/cli/bin/shim.js')
const endpoint = new URL('/api/stripe/webhook', origin).href
console.log(`Forwarding Stripe test payment events to ${endpoint}`)
console.log('Keep this terminal running while completing checkout. Stop with Ctrl+C.')

const child = spawn(process.execPath, [cli, 'listen', '--skip-update', '--color', 'off',
  '--events', 'checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.expired,payment_intent.payment_failed,refund.created,refund.updated,refund.failed',
  '--forward-to', endpoint], {
  env: { ...process.env, STRIPE_API_KEY: key },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let savedSecret = ''
let saveFailed = false
function output(line) {
  const secret = line.match(/\bwhsec_[a-zA-Z0-9]+\b/)?.[0]
  if (secret && secret !== savedSecret) {
    try {
      const path = new URL('../.env.local', import.meta.url)
      let content
      try { content = readFileSync(path, 'utf8') } catch (error) {
        if (error.code !== 'ENOENT') throw error
        content = ''
      }
      content = /^STRIPE_WEBHOOK_SECRET=.*$/m.test(content)
        ? content.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, `STRIPE_WEBHOOK_SECRET=${secret}`)
        : `${content}${content.endsWith('\n') || !content ? '' : '\n'}STRIPE_WEBHOOK_SECRET=${secret}\n`
      writeFileSync(path, content, { mode: 0o600 })
      savedSecret = secret
      console.log('Webhook signing secret saved privately to .env.local. Restart the app if it was already running.')
    } catch {
      saveFailed = true
      console.error('Could not save the webhook secret to .env.local. Check that the file is writable, then retry.')
      child.kill('SIGTERM')
    }
  }
  console.log(line.replace(/\bwhsec_[a-zA-Z0-9]+\b/g, '[saved privately]')
    .replace(/\b(?:sk|rk)_(?:test|live)_[a-zA-Z0-9]+\b/g, '[redacted key]'))
}
createInterface({ input: child.stdout }).on('line', output)
createInterface({ input: child.stderr }).on('line', output)
child.on('error', () => { console.error('Could not start Stripe CLI. Run npm install, then retry.'); process.exitCode = 1 })
child.on('close', (code) => { process.exitCode = saveFailed ? 1 : code ?? 0 })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
