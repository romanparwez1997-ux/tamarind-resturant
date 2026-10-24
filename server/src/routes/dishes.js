import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

// GET /api/dishes  ->  the whole menu as JSON
// `chefs_pick AS "chefsPick"` renames the column so the JSON has the same
// shape as the old hardcoded array, and the React components didn't change.
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, course, service, veg, price, description, spice,
            chefs_pick AS "chefsPick", tag
     FROM dishes
     ORDER BY id`,
  )
  res.json(rows)
})

export default router
