// Disposable account only. Mail is captured in memory; nothing is sent to Resend.
import '../db/env.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { betterAuth } from 'better-auth'
import { pool } from '../src/server/db.js'
import { accountEmailOptions } from '../src/server/mail.js'

await test('account changes verify email before mutation and revoke other password sessions', async () => {
  const origin = 'http://localhost:3000'
  const sent = []
  const mailOptions = accountEmailOptions({ ready: true, send: async message => { sent.push(message) } })
  const fixture = randomUUID()
  const email = `account-test-${fixture}@example.invalid`
  const newEmail = `account-new-${fixture}@example.invalid`
  const password = `fixture-only-${randomUUID()}`
  const newPassword = `fixture-only-${randomUUID()}`
  const auth = betterAuth({ database: pool, baseURL: origin, secret: 'isolated-account-test-secret-at-least-32-characters',
    trustedOrigins: [origin], emailAndPassword: { enabled: true, minPasswordLength: 8 }, ...mailOptions,
    logger: { level: 'error' }, advanced: { database: { generateId: () => randomUUID() } } })
  let userId
  async function call(path, body, cookie = '') {
    return auth.handler(new Request(`${origin}/api/auth/${path}`, {
      method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }))
  }
  const cookieOf = response => response.headers.getSetCookie().map(cookie => cookie.split(';')[0]).join('; ')
  const savedUser = async () => (await pool.query('SELECT name, email, "emailVerified" FROM "user" WHERE id = $1', [userId])).rows[0]
  try {
    const signup = await call('sign-up/email', { name: 'Disposable Account', email, password })
    assert.equal(signup.status, 200)
    const data = await signup.json()
    userId = data.user.id
    const cookie = cookieOf(signup)
    assert.ok(cookie.includes('session_token'))
    assert.equal((await call('update-user', { name: 'Updated Fixture' }, cookie)).status, 200)
    assert.equal((await savedUser()).name, 'Updated Fixture')
    const secondLogin = await call('sign-in/email', { email, password })
    assert.equal(secondLogin.status, 200)
    const otherCookie = cookieOf(secondLogin)
    assert.equal((await call('change-email', { newEmail, callbackURL: '/account?email=verified' }, cookie)).status, 200)
    assert.equal((await savedUser()).email, email, 'unverified email changes do not mutate immediately')
    assert.equal(sent.at(-1).user.email, newEmail)
    const verification = await auth.handler(new Request(sent.at(-1).url))
    assert.equal(verification.status, 302)
    assert.equal((await savedUser()).email, newEmail)
    assert.equal((await savedUser()).emailVerified, true)
    // A verified current email requires approval there before sending to a new inbox.
    assert.equal((await call('change-email', { newEmail: email, callbackURL: '/account?email=verified' }, cookie)).status, 200)
    assert.equal(sent.at(-1).user.email, newEmail)
    assert.equal(sent.at(-1).changingEmail, true)
    assert.equal((await savedUser()).email, newEmail)
    assert.equal((await auth.handler(new Request(sent.at(-1).url))).status, 302)
    assert.equal(sent.at(-1).user.email, email)
    assert.equal((await savedUser()).email, newEmail, 'old inbox approval still requires new inbox verification')
    assert.equal((await auth.handler(new Request(sent.at(-1).url))).status, 302)
    assert.equal((await savedUser()).email, email)
    assert.equal((await call('change-password', { currentPassword: 'wrong-fixture-password', newPassword }, cookie)).status, 400)
    assert.equal((await call('change-password', { currentPassword: password, newPassword, revokeOtherSessions: true }, cookie)).status, 200)
    const otherSession = await auth.handler(new Request(`${origin}/api/auth/get-session`, { headers: { Cookie: otherCookie } }))
    assert.equal(await otherSession.json(), null, 'another device is signed out after password change')
    assert.equal((await call('sign-in/email', { email, password })).status, 401)
    assert.equal((await call('sign-in/email', { email, password: newPassword })).status, 200)
    assert.equal((await call('update-user', { name: 'Unauthenticated' })).status, 401)
  } finally {
    // Remove only this fixture and its auth records. Never touches real profiles.
    if (userId) {
      await pool.query('DELETE FROM session WHERE "userId" = $1', [userId])
      await pool.query('DELETE FROM account WHERE "userId" = $1', [userId])
      await pool.query('DELETE FROM "user" WHERE id = $1', [userId])
    }
    await pool.end()
  }
})
