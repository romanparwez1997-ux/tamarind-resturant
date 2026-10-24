import express from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.js'
import { pool } from './db.js'
import bookingsRouter from './routes/bookings.js'
import dishesRouter from './routes/dishes.js'
import tablesRouter from './routes/tables.js'

const app = express()

// 1. Auth. Better Auth handles everything under /api/auth/ itself.
//    It must come BEFORE express.json(), because it reads the request body itself.
app.all('/api/auth/*splat', toNodeHandler(auth))

// 2. Turn JSON request bodies into req.body for our own routes.
app.use(express.json())

// 3. Our API
app.get('/', (req, res) => {
  res.json({
    name: 'Tamarind & Tide API',
    routes: ['GET /api/health', 'GET /api/dishes', 'GET /api/tables', 'GET /api/bookings/taken', '/api/auth/*'],
  })
})
// Health check: is the database reachable, do the tables exist, are the
// settings present? Shows only yes/no for secrets, never their values.
app.get('/api/health', async (req, res) => {
  const report = {
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      BETTER_AUTH_SECRET: Boolean(process.env.BETTER_AUTH_SECRET),
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || null, // not secret: it's the public site address
    },
  }
  try {
    const { rows } = await pool.query(
      `SELECT to_regclass('public.dishes') IS NOT NULL AS dishes, to_regclass('public."user"') IS NOT NULL AS users`,
    )
    report.database = 'connected'
    report.tables = rows[0].dishes && rows[0].users ? 'ok' : 'missing: run npm run db:migrate and db:seed against this database'
  } catch (err) {
    report.database = `cannot connect (${err.code || 'error'})`
  }
  report.ok = report.database === 'connected' && report.tables === 'ok' && report.env.BETTER_AUTH_SECRET
  res.status(report.ok ? 200 : 500).json(report)
})
app.use('/api/dishes', dishesRouter)
app.use('/api/tables', tablesRouter)
app.use('/api/bookings', bookingsRouter)

// 4. Anything else is a 404, as JSON (not Express's default HTML page)
app.use((req, res) => res.status(404).json({ error: 'Not found' }))

// 5. If any route throws, log the real error here and send a safe message.
//    (Express 5 catches errors from async routes automatically.)
app.use((err, req, res, next) => {
  // err.status is set for bad requests, e.g. a body that isn't valid JSON (400)
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

// Start listening. Locally that's port 3000. On Vercel, the platform sees
// app.listen and runs the app as a Vercel Function instead.
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
