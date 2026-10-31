// 1240 -> "₹1,240"   ('en-IN' gives Indian grouping: ₹1,00,000)
export const rupees = (n) => `₹${n.toLocaleString('en-IN')}`

// Is this dish on the lunch / dinner menu?
export const isServed = (dish, service) => dish.service === 'both' || dish.service === service

// Turns the quantities object { dishId: plates } into what the thali shows.
// `dishes` is the menu loaded from the API.
// Only dishes served right now count, so switching lunch <-> dinner
// hides dinner-only dishes from the thali without forgetting them.
export function getThali(dishes, quantities, service) {
  const items = dishes
    .filter((dish) => isServed(dish, service) && quantities[dish.id] > 0)
    .map((dish) => ({ dish, qty: quantities[dish.id] }))

  const plates = items.reduce((sum, item) => sum + item.qty, 0)
  const total = items.reduce((sum, item) => sum + item.qty * item.dish.price, 0)

  return { items, plates, total }
}

// Today's date at the restaurant (India time) as 'YYYY-MM-DD', the format
// <input type="date"> and the API use. ('en-CA' happens to write dates that way.)
// The server works out "today" the same way, so they always agree.
export const restaurantToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

// '2026-10-23' -> 'Fri, 23 Oct'
export const prettyDate = (date) =>
  new Date(`${date}T00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
