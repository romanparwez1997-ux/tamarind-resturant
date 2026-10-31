// Seatings that can be booked. Must match `seatings` in src/data/tables.js
// ('8:00 pm' is missing on purpose: it's shown as full there).
export const OPEN_SEATINGS = ['12:30 pm', '1:45 pm', '7:00 pm', '9:15 pm']

// '2026-10-23' -> true. Also rejects impossible dates like 2026-02-31.
export function isValidDate(text) {
  return typeof text === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text)) && new Date(text).toISOString().startsWith(text)
}

// Today's date at the restaurant (India time) as 'YYYY-MM-DD'. The client uses the same rule.
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

