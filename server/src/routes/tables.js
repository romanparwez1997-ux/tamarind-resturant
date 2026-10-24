import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

// GET /api/tables  ->  the 9 dining tables with their seats and floor-plan position
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT id, seats, zone, x, y FROM dining_tables ORDER BY id')
  res.json(rows)
})

export default router
