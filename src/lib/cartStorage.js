// A draft selection is not a purchase: retain only bounded dish IDs/quantities.
// Names, prices, user IDs and payment status never enter this browser store.
export const EMPTY_CART = Object.freeze({})
const key = 'tamarind:cart'
const changeEvent = 'tamarind:cart-change'
let lastRaw
let cached = EMPTY_CART

export function normalizeCart(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([id,qty]) =>
    /^[1-9]\d{0,9}$/.test(id) && Number(id) <= 2147483647 && Number.isInteger(qty) && qty >= 1 && qty <= 9,
  ).slice(0,50))
}
export function readCart() {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw !== lastRaw) {
      lastRaw = raw
      try { cached = normalizeCart(raw && raw.length <= 16000 ? JSON.parse(raw) : {}) } catch { cached = EMPTY_CART }
    }
  } catch { /* In-memory selections still work when storage is unavailable. */ }
  return cached
}
export function writeCart(value) {
  cached = normalizeCart(value)
  lastRaw = JSON.stringify(cached)
  try { sessionStorage.setItem(key,lastRaw) } catch { /* Keep the in-memory selection. */ }
  dispatchEvent(new Event(changeEvent))
}
export function subscribeCart(listener) {
  addEventListener(changeEvent,listener)
  addEventListener('storage',listener)
  return () => { removeEventListener(changeEvent,listener); removeEventListener('storage',listener) }
}
