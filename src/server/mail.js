import { APIError } from 'better-auth/api'

export const emailDeliveryReady = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

// The same confirmation rules are used in the app and in isolated account tests.
export function accountEmailOptions({ ready = emailDeliveryReady(), send = sendAccountEmail } = {}) {
  return {
    user: { changeEmail: {
      enabled: ready,
      updateEmailWithoutVerification: false,
      sendChangeEmailConfirmation: async ({ user, url }) => send({ user, url, changingEmail: true }),
    } },
    emailVerification: {
      expiresIn: 3600,
      sendOnSignUp: false,
      sendOnSignIn: false,
      ...(ready ? { sendVerificationEmail: async ({ user, url }) => send({ user, url }) } : {}),
    },
  }
}
const escape = (value) => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])

export async function sendAccountEmail({ user, url, changingEmail = false }) {
  if (!emailDeliveryReady()) throw new APIError('SERVICE_UNAVAILABLE', { message: 'Email verification is temporarily unavailable. Please try again later.' })
  const subject = changingEmail ? 'Approve your email change — Tamarind & Tide' : 'Confirm your email — Tamarind & Tide'
  const action = changingEmail ? 'Approve email change' : 'Confirm email address'
  let response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [user.email], subject,
        text: `Hello ${user.name || 'there'},\n\n${action}: ${url}\n\nThis link expires in one hour. If you did not request this, ignore this email.\n\nTamarind & Tide · Konark, Odisha`,
        html: `<div style="font-family:Arial,sans-serif;background:#edf3f1;padding:36px;color:#103c48"><h1 style="font-family:Georgia,serif;font-weight:400">Tamarind &amp; Tide</h1><p>Hello ${escape(user.name || 'there')},</p><p>One more step before you settle in.</p><a href="${escape(url)}" style="display:inline-block;background:#103c48;color:#fff;padding:15px 24px;text-decoration:none">${action}</a><p style="font-size:12px;margin-top:28px">This link expires in one hour. If you did not request this, ignore this email.</p><p style="font-size:12px">Konark, Odisha · A little coast. A lot of soul.</p></div>` }),
    })
  } catch { throw new APIError('SERVICE_UNAVAILABLE', { message: 'We could not send your verification email. Please try again later.' }) }
  if (!response.ok) {
    console.error('Account email delivery failed:', response.status)
    throw new APIError('SERVICE_UNAVAILABLE', { message: 'We could not send your verification email. Please try again later.' })
  }
}
