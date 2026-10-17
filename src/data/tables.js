// The dining room. 9 tables, 32 seats.
// x / y = centre of the table, as a % of the floor plan's width / height.
export const tables = [
  { id: 'T1', seats: 2, zone: 'Window', x: 12, y: 20 },
  { id: 'T2', seats: 2, zone: 'Window', x: 32, y: 20 },
  { id: 'T3', seats: 4, zone: 'Window', x: 56, y: 20 },
  { id: 'T4', seats: 4, zone: 'Window', x: 82, y: 20 },
  { id: 'T5', seats: 6, zone: 'Courtyard', x: 20, y: 50 },
  { id: 'T6', seats: 6, zone: 'Courtyard', x: 52, y: 50 },
  { id: 'T7', seats: 4, zone: 'Courtyard', x: 84, y: 50 },
  { id: 'T8', seats: 2, zone: 'Counter', x: 16, y: 80 },
  { id: 'T9', seats: 2, zone: 'Counter', x: 36, y: 80 },
]

// How wide each table is drawn (% of the floor width), by number of seats
export const tableWidth = { 2: 11, 4: 15, 6: 24 }

// Seatings depend on the service. `full: true` = can't be picked.
export const seatings = {
  lunch: [{ time: '12:30 pm' }, { time: '1:45 pm' }],
  dinner: [{ time: '7:00 pm' }, { time: '8:00 pm', full: true }, { time: '9:15 pm' }],
}

// Tables already taken at each seating (hardcoded until the Week 3 backend)
export const bookedTables = {
  '12:30 pm': ['T3', 'T5'],
  '1:45 pm': ['T1'],
  '7:00 pm': ['T2', 'T6', 'T8'],
  '9:15 pm': ['T4', 'T9'],
}
