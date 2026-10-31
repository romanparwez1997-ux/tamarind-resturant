import pg from 'pg'

// Don't crash if it's missing: log it, keep the server up, and let
// GET /api/health report "DATABASE_URL": false so the problem is easy to spot.
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Locally: fill in .env.local. On Vercel: Settings → Environment Variables.')
}

// A pool keeps a few database connections open and lends them out per query,
// instead of connecting from scratch on every request.
// Use it as:  const { rows } = await pool.query('SELECT … WHERE id = $1', [id])
// The $1, $2 placeholders send values separately from the SQL, which is what
// stops SQL injection. Never build SQL by gluing strings together.
// Reuse the pool across Next.js development hot reloads.
export const pool = globalThis.tamarindPool ?? new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
})
if (process.env.NODE_ENV !== 'production') globalThis.tamarindPool = pool
