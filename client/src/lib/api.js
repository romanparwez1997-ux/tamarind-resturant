// Every call to our own Express API goes through here.
// The paths start with /api, which the Vite proxy (dev) or Vercel rewrite
// (live) forwards to the server. Cookies are sent automatically because the
// request goes to the same site the page came from.

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })

  if (res.status === 204) return null // success, nothing to read (e.g. DELETE)

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // The server sends errors as { error: 'message' }
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export const getDishes = () => request('/api/dishes')

export const getTables = () => request('/api/tables')

export const getTakenTables = (date, seating) =>
  request(`/api/bookings/taken?${new URLSearchParams({ date, seating })}`).then((data) => data.taken)

export const getMyBookings = () => request('/api/bookings/mine')

export const createBooking = (booking) => request('/api/bookings', { method: 'POST', body: JSON.stringify(booking) })

export const cancelBooking = (id) => request(`/api/bookings/${id}`, { method: 'DELETE' })
