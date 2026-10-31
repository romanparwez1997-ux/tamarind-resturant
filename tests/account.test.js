import test from 'node:test'
import assert from 'node:assert/strict'
import { localReturnPath } from '../src/lib/localReturnPath.js'
import { accountEmailOptions, sendAccountEmail } from '../src/server/mail.js'

test('sign-in return links cannot redirect to another origin', () => {
  assert.equal(localReturnPath('/checkout?order_id=example'), '/checkout?order_id=example')
  for (const path of [null, 'https://example.com', '//example.com', '/\\example.com', '/\n/example.com']) {
    assert.equal(localReturnPath(path), '/account')
  }
})

test('email changes never opt out of verification, even when delivery is unavailable', () => {
  const options = accountEmailOptions({ ready: false })
  assert.equal(options.user.changeEmail.enabled, false)
  assert.equal(options.user.changeEmail.updateEmailWithoutVerification, false)
  assert.equal(options.emailVerification.sendVerificationEmail, undefined)
})

test('email sender escapes content and surfaces delivery failures without logging tokens', async t => {
  const previousKey = process.env.RESEND_API_KEY
  const previousFrom = process.env.EMAIL_FROM
  t.after(() => {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
    if (previousFrom === undefined) delete process.env.EMAIL_FROM
    else process.env.EMAIL_FROM = previousFrom
  })
  process.env.RESEND_API_KEY = 'test-only-no-network'
  process.env.EMAIL_FROM = 'Test <test@example.invalid>'
  let body
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    body = JSON.parse(options.body)
    return { ok: true }
  })
  await sendAccountEmail({ user: { name: '<script>bad</script>', email: 'recipient@example.invalid' }, url: 'https://example.invalid/verify?token=fixture&callbackURL=/account' })
  assert.ok(body.html.includes('&lt;script&gt;'))
  assert.ok(!body.html.includes('<script>'))
  assert.deepEqual(body.to, ['recipient@example.invalid'])
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('network unavailable') })
  await assert.rejects(sendAccountEmail({ user: { email: 'recipient@example.invalid' }, url: 'https://example.invalid/verify' }), error => {
    assert.equal(error.status, 'SERVICE_UNAVAILABLE')
    assert.ok(!error.message.includes('token'))
    return true
  })
})
