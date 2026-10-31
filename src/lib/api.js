// Browser calls use the same Next.js origin, so session cookies are sent automatically.

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })

  if (res.status === 204) return null // success, nothing to read (e.g. DELETE)

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // The server sends errors as { error: 'message' }
    throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status })
  }
  return data
}

export const getDishes = () => request('/api/dishes')

export const getTables = signal => request('/api/tables', { signal })

export const getTakenTables = (date, seating, signal) =>
  request(`/api/bookings/taken?${new URLSearchParams({ date, seating })}`, { signal, cache: 'no-store' }).then((data) => data.taken)

export const getMyBookings = signal => request('/api/bookings/mine', { signal, cache: 'no-store' })

export const createBooking = (booking) => request('/api/bookings', { method: 'POST', body: JSON.stringify(booking) })

export const cancelBooking = (id) => request(`/api/bookings/${id}`, { method: 'DELETE' })

export const startCheckout = (items, checkoutKey) => request('/api/checkout', {
  method: 'POST', body: JSON.stringify({ items, checkoutKey }),
})

export const getOrder = (id, signal) => request(`/api/orders/${encodeURIComponent(id)}`, { cache: 'no-store', signal })
export const cancelOrder = id => request(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' })
export const getOrders = (page = 1, status = 'all', signal) => request(`/api/orders?${new URLSearchParams({ page, status })}`, { cache: 'no-store', signal })
export const getAccountSettings = () => request('/api/account/settings', { cache: 'no-store' })
