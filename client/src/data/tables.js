// The 9 tables now live in the database (GET /api/tables), and which ones are
// taken comes from real bookings (GET /api/bookings/taken).

// How wide each table is drawn (% of the floor width), by number of seats
export const tableWidth = { 2: 11, 4: 15, 6: 24 }

// Seatings depend on the service. `full: true` = can't be picked.
// The server has the same list (OPEN_SEATINGS in server/src/routes/bookings.js).
export const seatings = {
  lunch: [{ time: '12:30 pm' }, { time: '1:45 pm' }],
  dinner: [{ time: '7:00 pm' }, { time: '8:00 pm', full: true }, { time: '9:15 pm' }],
}
