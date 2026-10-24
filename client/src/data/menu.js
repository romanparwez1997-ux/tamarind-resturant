// The dishes themselves now live in the database (see server/db/seed-data.js)
// and are loaded from GET /api/dishes. Only fixed labels stay here.

// Tabs above the menu grid
export const courses = [
  { id: 'starters', label: 'Starters' },
  { id: 'mains', label: 'Mains' },
  { id: 'desserts', label: 'Desserts' },
]

// Words shown next to the spice slider (index = slider value 0–3)
export const spiceLabels = ['No heat', 'Mild', 'Medium', 'Fiery']

// Fish in the scrolling ticker
export const todaysCatch = [
  'Kingfish (Anjal)',
  'Pomfret',
  'Tiger prawns',
  'Ladyfish (Kane)',
  'Mussels (Marvai)',
  'Mackerel (Bangude)',
]
