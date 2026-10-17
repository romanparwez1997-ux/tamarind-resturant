import { dishes } from './data/menu'

// 1240 -> "₹1,240"   ('en-IN' gives Indian grouping: ₹1,00,000)
export const rupees = (n) => `₹${n.toLocaleString('en-IN')}`

// Is this dish on the lunch / dinner menu?
export const isServed = (dish, service) => dish.service === 'both' || dish.service === service

// Turns the quantities object { dishId: plates } into what the thali shows.
// Only dishes served right now count, so switching lunch <-> dinner
// hides dinner-only dishes from the thali without forgetting them.
export function getThali(quantities, service) {
  const items = dishes
    .filter((dish) => isServed(dish, service) && quantities[dish.id] > 0)
    .map((dish) => ({ dish, qty: quantities[dish.id] }))

  const plates = items.reduce((sum, item) => sum + item.qty, 0)
  const total = items.reduce((sum, item) => sum + item.qty * item.dish.price, 0)

  return { items, plates, total }
}
