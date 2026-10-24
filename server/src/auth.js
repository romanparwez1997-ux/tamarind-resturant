import { betterAuth } from 'better-auth'
import { pool } from './db.js'

// Better Auth does signup, login, logout, password hashing and sessions.
// It stores everything in the "user", "session" and "account" tables
// (see db/schema.sql) using the same database pool as the rest of the app.
// It answers every request under /api/auth/* (mounted in index.js), e.g.
//   POST /api/auth/sign-up/email   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out        GET  /api/auth/get-session
export const auth = betterAuth({
  database: pool,

  // Signs the session cookie. Anyone with this could forge logins: keep it in .env.
  secret: process.env.BETTER_AUTH_SECRET,

  // The address people use in the browser (the frontend). Requests to the API
  // arrive through the frontend's /api proxy (Vite locally, Vercel when live),
  // so the browser sees one site and the session cookie is a normal
  // first-party cookie. Logins coming from any other website are rejected.
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // stay signed in for 7 days (in seconds)
  },
})
