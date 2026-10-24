// Loads the Week 2 menu and floor plan into the database.
// Usage: npm run db:seed   (run db:migrate first)
//
// It is safe to run more than once: ON CONFLICT … DO UPDATE means
// "if this id already exists, overwrite it" (an "upsert"), so you never get
// duplicates, and editing seed-data.js then re-seeding updates the rows.
import { pool } from '../src/db.js'
import { dishes, tables } from './seed-data.js'

for (const dish of dishes) {
  await pool.query(
    `INSERT INTO dishes (id, name, course, service, veg, price, description, spice, chefs_pick, tag)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, course = EXCLUDED.course, service = EXCLUDED.service,
       veg = EXCLUDED.veg, price = EXCLUDED.price, description = EXCLUDED.description,
       spice = EXCLUDED.spice, chefs_pick = EXCLUDED.chefs_pick, tag = EXCLUDED.tag`,
    [
      dish.id,
      dish.name,
      dish.course,
      dish.service,
      dish.veg,
      dish.price,
      dish.description,
      dish.spice,
      dish.chefsPick ?? false,
      dish.tag ?? null,
    ],
  )
}
console.log(`✓ Seeded ${dishes.length} dishes`)

for (const table of tables) {
  await pool.query(
    `INSERT INTO dining_tables (id, seats, zone, x, y)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       seats = EXCLUDED.seats, zone = EXCLUDED.zone, x = EXCLUDED.x, y = EXCLUDED.y`,
    [table.id, table.seats, table.zone, table.x, table.y],
  )
}
console.log(`✓ Seeded ${tables.length} dining tables`)

await pool.end()
