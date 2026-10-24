import pg from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Copy server/.env.example to server/.env and fill it in.')
}

// A pool keeps a few database connections open and lends them out per query,
// instead of connecting from scratch on every request.
// Use it as:  const { rows } = await pool.query('SELECT … WHERE id = $1', [id])
// The $1, $2 placeholders send values separately from the SQL, which is what
// stops SQL injection. Never build SQL by gluing strings together.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
