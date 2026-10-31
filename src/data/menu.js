// The dishes themselves now live in the database (see db/seed-data.js)
// and are loaded from GET /api/dishes. Only fixed labels stay here.

// Tabs above the menu grid
export const courses = [
  { id: 'all', label: 'All courses' },
  { id: 'starters', label: 'Starters' },
  { id: 'mains', label: 'Mains' },
  { id: 'desserts', label: 'Desserts' },
]

export const cuisines = [
  { id: 'all', label: 'All kitchens' },
  { id: 'indian', label: 'Indian', note: 'Fire, spice & a little soul', imageId: 15 },
  { id: 'continental', label: 'Continental', note: 'Comfort, beautifully considered', imageId: 20 },
  { id: 'chinese', label: 'Chinese', note: 'From the heart of the wok', imageId: 25 },
  { id: 'italian', label: 'Italian', note: 'La dolce evening', imageId: 28 },
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
