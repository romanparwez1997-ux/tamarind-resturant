import { betterAuth } from 'better-auth'
import { pool } from './db.js'
import { accountEmailOptions } from './mail.js'

// Same auth tables and cookie sessions as before; Next.js serves /api/auth/*.
export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL].filter(Boolean),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  ...accountEmailOptions(),
  session: { expiresIn: 60 * 60 * 24 * 7 },
})
