import pg from 'pg'

// Don't crash if it's missing: log it, keep the server up, and let
// GET /api/health report "DATABASE_URL": false so the problem is easy to spot.
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Locally: fill in server/.env. On Vercel: Settings → Environment Variables.')
}

// A pool keeps a few database connections open and lends them out per query,
// instead of connecting from scratch on every request.
// Use it as:  const { rows } = await pool.query('SELECT … WHERE id = $1', [id])
// The $1, $2 placeholders send values separately from the SQL, which is what
// stops SQL injection. Never build SQL by gluing strings together.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
