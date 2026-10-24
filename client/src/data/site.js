
export const services = {
  lunch: {
    label: 'Lunch',
    hours: '12 – 3 pm',
    lede: 'Fish meals on banana leaf, red rice by the plateful, and a curry that changes with the catch. The way the coast eats at noon.',
    badge: 'BANANA-LEAF MEALS · NOON TILL THREE ·',
    catchLabel: "Today's catch",
    reserveNote: 'Two lunch seatings, Tuesday to Sunday. Walk-ins welcome at the counter.',
  },
  dinner: {
    label: 'Dinner',
    hours: '7 – 11 pm',
    lede: 'Fish off the morning boats, coconut ground by hand, and ghee roasts that take their time. Dinner by the sea, cooked the way the coast cooks at home.',
    badge: 'FRESH FROM THE ARABIAN SEA · COOKED OVER COAL ·',
    catchLabel: "Tonight's catch",
    reserveNote: 'Three dinner seatings, Tuesday to Sunday. Tables are held for 15 minutes.',
  },
}

export const heroFacts = ['32 seats', 'Menu rewritten daily', 'Lunch & dinner']

export const stats = [
  { value: '6 am', label: 'Boats in, menu written' },
  { value: '32', label: 'Seats, never more' },
  { value: '0', label: 'Freezers for fish' },
]

// "A day at Tamarind & Tide". `service` marks the step that is highlighted
// when the site is in that mode.
export const dayTimeline = [
  { time: '6:00 am', title: 'Boats come in', text: 'We buy at Hoige Bazaar wharf before the auction ends.' },
  { time: '9:30 am', title: 'Stone & coconut', text: 'Masala on the grinding stone, coconut scraped by hand.' },
  { time: '12:00 pm', title: 'Lunch service', text: 'Fish meals on banana leaf until three.', service: 'lunch' },
  { time: '4:00 pm', title: 'Chalkboard', text: 'The dinner menu is rewritten from what is left.' },
  { time: '7:00 pm', title: 'Coals lit', text: 'First dinner seating sits down.', service: 'dinner' },
]

export const perks = [
  'We confirm on WhatsApp within the hour',
  'Free cancellation up to 4 pm on the day',
  'Tables of 7 or more: please call us',
]

export const hours = [
  { days: 'Monday', time: "Closed (we're at the market)", closed: true },
  { days: 'Tue – Fri', time: '12–3 pm · 7–11 pm' },
  { days: 'Sat – Sun', time: '12–4 pm · 7–11:30 pm' },
]
