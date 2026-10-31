// Add the new catalogue without rewriting existing prices, descriptions or receipts.
import './env.js'
import { pool } from '../src/server/db.js'
import { expandedDishes } from './expanded-menu.js'
const client = await pool.connect()
try {
  await client.query('BEGIN')
  for (const dish of expandedDishes) {
    const { rows: [existing] } = await client.query('SELECT name FROM dishes WHERE id = $1', [dish.id])
    if (existing && existing.name !== dish.name) throw new Error(`Dish ID ${dish.id} is already used by another product; no menu changes were applied.`)
    await client.query(`INSERT INTO dishes (id, name, course, service, veg, price, description, spice, chefs_pick, cuisine)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
    [dish.id, dish.name, dish.course, dish.service, dish.veg, dish.price, dish.description, dish.spice, dish.chefsPick, dish.cuisine])
  }
  await client.query("UPDATE dishes SET cuisine = 'italian' WHERE id = 14 AND name = 'Filter-coffee Panna Cotta'")
  await client.query('COMMIT')
  console.log('✓ Expanded menu ready: 16 new dishes across four cuisines; existing purchases preserved.')
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally { client.release(); await pool.end() }
