// Creates every table by running schema.sql against DATABASE_URL.
// Usage: npm run db:migrate
import { readFile } from 'node:fs/promises'
import { pool } from '../src/db.js'

const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
await pool.query(sql)
console.log('✓ Schema is up to date')
await pool.end()
