> **Note (Assignment 3):** this page was written for Assignment 2 and is kept for the frontend details.
> Since then the React app has moved into `client/` (so `src/…` below means `client/src/…`), the
> `dishes` and `tables` arrays have moved into the Postgres database and are fetched from the API, and
> the booking form saves real bookings. See the main [README](../README.md) for the backend.

# Tamarind & Tide (React + Tailwind)

Assignment 2: my Assignment 1 restaurant site, rebuilt with **Vite + React + Tailwind CSS v4**.
It's the same business, content, colours and fonts, with new layouts and four new interactive features.

```bash
npm install
npm run dev      # open http://localhost:5173
npm run build    # production build into dist/
```

No TypeScript, no extra libraries (only `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`), and all data is hardcoded.

---

## Contents

1. [Assignment checklist](#1-assignment-checklist)
2. [The four new features](#2-the-four-new-features)
3. [How the app starts](#3-how-the-app-starts)
4. [Where state lives (the big picture)](#4-where-state-lives-the-big-picture)
5. [File-by-file explanation](#5-file-by-file-explanation)
6. [How useState works here](#6-how-usestate-works-here)
7. [How the controlled components work](#7-how-the-controlled-components-work)
8. [Tailwind patterns used](#8-tailwind-patterns-used)
9. [Likely assessment questions](#9-likely-assessment-questions)
10. [Commit plan](#10-commit-plan)

---

## 1. Assignment checklist

| Requirement | Where |
|---|---|
| Vite + React inside the existing repo | `package.json`, `vite.config.js`, `index.html`, `src/main.jsx` |
| Header, hero, main content and footer as their own components | `Header.jsx`, `Hero.jsx`, `Menu.jsx` (main content), `Footer.jsx`, plus `About`, `Reserve` and smaller parts |
| Listed items in one data file, as an array of objects | `src/data/menu.js` holds the `dishes` array. Cards are made with `.map()`, never copy-pasted JSX |
| Tailwind fully wired in, old styles.css removed | `@tailwindcss/vite` in `vite.config.js`; `src/index.css` contains only Tailwind setup and design tokens |
| One real filter on the main grid, built with useState | `Menu.jsx` has course tabs, a veg-only switch and a spice slider, all `useState` |
| One small controlled component reused per item | `PortionStepper.jsx` appears on every dish card, and is reused again for the guest count |
| Mobile-first responsive classes | Unprefixed classes are for phones; `sm:` / `md:` / `lg:` add the bigger layouts |
| No horizontal scroll | Tested at 320, 375, 768, 1024 and 1440px, in both lunch and dinner mode |

---

## 2. The four new features

| Feature | What it does | Main files |
|---|---|---|
| **☀ / ☾ Lunch–dinner service** | A switch in the header changes the whole site: colours (light ↔ dark), the menu (some dishes are lunch-only or dinner-only), hero text, the sun or moon, the night-time postcard, the highlighted step in "A day at", and the booking seatings. On first load it picks lunch before 4 pm and dinner after. | `App.jsx`, `ServiceToggle.jsx`, `index.css` |
| **🌶 Spice filter** | A 0–3 slider ("No heat" → "Fiery") hides dishes hotter than the chosen level. It works together with the course tabs and the veg switch, and each tab shows a live count. | `Menu.jsx`, `MenuFilters.jsx` |
| **🍃 Build-your-thali** | The + / − stepper on each dish adds plates to a banana leaf. Each dish becomes a steel bowl, the bowls space themselves evenly round the leaf, and a running bill appears underneath. On phones, a sticky bar shows the total while you scroll. | `Thali.jsx`, `DishCard.jsx`, `utils.js` |
| **🪑 Seat-map booking** | A drawn floor plan of all 9 tables (32 seats). You pick your own table. Tables that are taken at that seating, or too small for your party, are disabled. The ticket stub shows your table and your pre-ordered thali. | `SeatMap.jsx`, `Reserve.jsx`, `data/tables.js` |

---

## 3. How the app starts

```
index.html  →  src/main.jsx  →  src/App.jsx  →  src/components/*
```

- **`index.html`** loads the Google Fonts and has one empty `<div id="root">`. React draws everything inside that div.
- **`src/main.jsx`** imports `index.css` (Tailwind) and renders `<App />` into `#root`. `StrictMode` only adds extra development warnings.
- **`vite.config.js`** turns on two plugins: `react()` so Vite understands JSX, and `tailwindcss()` so Tailwind scans the code and generates only the classes that are actually used.

### Folder map

```
src/
├─ main.jsx              start-up: renders <App/>
├─ App.jsx               page layout + the two shared states
├─ index.css             Tailwind, colour tokens, lunch/dinner themes, illustrations
├─ utils.js              rupees(), isServed(), getThali()
├─ classes.js            reusable button/label class strings
├─ data/
│  ├─ menu.js            dishes[], courses[], spiceLabels[], todaysCatch[]
│  ├─ site.js            lunch/dinner text, stats, timeline, perks, hours
│  └─ tables.js          floor plan tables, seatings, booked tables
└─ components/
   ├─ Header.jsx         logo, nav, mobile menu, service switch
   ├─ ServiceToggle.jsx  ☀ Lunch / ☾ Dinner switch (controlled)
   ├─ Hero.jsx           headline, plate art, "now serving" pill
   ├─ Ticker.jsx         scrolling "today's catch" strip
   ├─ About.jsx          story, postcard, quote, "A day at" timeline
   ├─ Menu.jsx           filter state + dish grid + thali   ← main content
   ├─ MenuFilters.jsx    tabs, veg switch, spice slider (controlled)
   ├─ DishCard.jsx       one dish
   ├─ PortionStepper.jsx − 0 + stepper (controlled, reused)
   ├─ Thali.jsx          banana leaf with bowls + bill
   ├─ Reserve.jsx        booking state + ticket form
   ├─ SeatMap.jsx        floor plan (controlled)
   ├─ Footer.jsx         hours, address, contact
   └─ ui.jsx             Container, Eyebrow, DietMark, SpiceMeter, Wave
```

---

## 4. Where state lives (the big picture)

React rule: **put state in the lowest component that every user of it sits under.**

```
App ─────────────── service ('lunch' | 'dinner'), quantities ({ dishId: plates })
 │                  thali = getThali(quantities, service)   ← derived, not state
 ├─ Header ──────── menuOpen
 │   └─ ServiceToggle       (controlled by App's service)
 ├─ Hero / About            (just read service)
 ├─ Menu ────────── course, vegOnly, maxSpice
 │   ├─ MenuFilters         (controlled by Menu's filter state)
 │   ├─ DishCard
 │   │   └─ PortionStepper  (controlled by App's quantities)
 │   └─ Thali               (displays App's thali)
 └─ Reserve ─────── guests, seating, tableId, submitted
     ├─ PortionStepper      (reused: controlled by Reserve's guests)
     └─ SeatMap             (controlled by Reserve's tableId)
```

Why each piece of state is where it is:

- **`service`** is in `App` because Header, Hero, About, Menu and Reserve all need it.
- **`quantities`** is in `App`, not `Menu`, because `Reserve` also shows the pre-ordered thali on the ticket. Moving state up to a shared parent is called **lifting state up**.
- **`menuOpen`** is in `Header` because nothing else cares about it.
- **The filters** are in `Menu` because only the menu uses them.
- **The booking choices** are in `Reserve` because only the booking uses them.

---

## 5. File-by-file explanation

### `src/index.css`

```css
@import "tailwindcss";
```
This one line switches Tailwind on and replaces the old `styles.css`.

```css
@theme {
  --color-chili: #c8432b;        /* → bg-chili, text-chili, border-chili … */
  --color-page:  #f7f0e3;        /* → bg-page  (theme colour, swapped for dinner) */
  --font-display: "Fraunces", …; /* → font-display */
  --animate-pop: pop 0.4s …;     /* → animate-pop */
}
```
`@theme` registers my design tokens. Tailwind turns each variable into classes automatically. There are two kinds:

- **Brand colours** such as `ink`, `chili`, `turmeric` and `leaf` mostly stay the same in both modes.
- **Theme colours** (`page`, `band`, `card`, `fg`, `fg-soft`, `line`) are what components use for backgrounds, text and borders, so they can change for dinner.

**How dinner mode works, in CSS only:**
```css
[data-service="dinner"] {
  --color-page: #0b2422;
  --color-fg:   #f7f0e3;
  …
}
```
`App` puts `data-service="dinner"` on its outer `<div>`. That rule redefines the variables, and every `bg-page`, `text-fg` and `border-line` inside the div picks up the new values. React never handles colours. It only changes one attribute. Two brand colours (`tamarind`, `sea`) get lighter versions too, so they stay readable on the dark background.

`@keyframes` defines the ticker slide, the card fade-in (`rise`) and the bowl `pop`. `pop` animates the `scale` property rather than `transform`. Tailwind v4's `-translate-x-1/2` uses the separate `translate` property, so the two don't overwrite each other.

`@layer base` sets the page-wide defaults: smooth scrolling, `scroll-padding-top` so the sticky header doesn't cover headings, and the visible focus ring.

`@utility plate-art`, `postcard-day`, `floor-art` and the others are the gradient illustrations carried over from Assignment 1. They're too long to write as class names, so each one is a single custom class.

### `src/data/menu.js`

```js
{ id: 6, name: 'Kingfish Curry & Red Rice', course: 'mains', service: 'both',
  veg: false, price: 620, description: '…', spice: 2, chefsPick: true }
```
Each dish is one object with the same fields:

- `id` is unique. It's used for React's `key` and as the key in `quantities`.
- `course` decides which tab the dish appears under.
- `service` is `'lunch'`, `'dinner'` or `'both'` and decides which menu it's on.
- `veg` and `spice` are what the filters check.
- `chefsPick` and `tag` are optional. The card only shows them if they exist.

Adding a dish means adding one object; no JSX changes. In Week 3 this array will come from the backend instead.

`courses` holds the tabs, `spiceLabels[n]` is the word shown for slider value `n`, and `todaysCatch` feeds the ticker.

### `src/data/site.js`

```js
export const services = {
  lunch:  { label: 'Lunch',  hours: '12 – 3 pm', lede: '…', badge: '…', … },
  dinner: { label: 'Dinner', hours: '7 – 11 pm', lede: '…', badge: '…', … },
}
```
This holds all the text that differs between lunch and dinner. Components look it up with `services[service]`, so there's no `if` statement anywhere for text. The file also holds `stats`, `dayTimeline` (where `service: 'lunch'` marks the step that gets highlighted), `perks` and `hours`.

### `src/data/tables.js`

```js
{ id: 'T5', seats: 6, zone: 'Courtyard', x: 20, y: 50 }
```
- `x` and `y` are the centre of the table as a **percentage** of the floor plan, so the plan scales to any screen width.
- `tableWidth` sets how wide each table is drawn, based on its seat count.
- `seatings` lists the times for each service. `full: true` means that time can't be picked.
- `bookedTables['7:00 pm']` lists the tables already taken at that seating.

### `src/utils.js`

```js
export const rupees = (n) => `₹${n.toLocaleString('en-IN')}`
```
This turns `1660` into `₹1,660`. `'en-IN'` gives Indian grouping (₹1,00,000).

```js
export const isServed = (dish, service) => dish.service === 'both' || dish.service === service
```
This checks whether a dish is on the current menu.

```js
export function getThali(quantities, service) {
  const items = dishes
    .filter((dish) => isServed(dish, service) && quantities[dish.id] > 0)
    .map((dish) => ({ dish, qty: quantities[dish.id] }))
  const plates = items.reduce((sum, item) => sum + item.qty, 0)
  const total  = items.reduce((sum, item) => sum + item.qty * item.dish.price, 0)
  return { items, plates, total }
}
```
This turns `{ 10: 2, 6: 1 }` into a list the Thali can draw, plus the totals:

- `.filter` keeps the dishes that are picked *and* served right now.
- `.map` pairs each dish with its quantity.
- `.reduce` adds up plates and money, starting from `0`.

Because it filters by service, switching to dinner hides lunch-only bowls. The quantities are still stored, though, so switching back to lunch brings them back.

### `src/classes.js`

Shared Tailwind class strings (`btn`, `btnGhost`, `btnSmall`, `fieldLabel`). Every button uses `className={btn}`, so they all look the same and can be changed in one place.

### `src/App.jsx`

```js
const [service, setService] = useState(() => (new Date().getHours() < 16 ? 'lunch' : 'dinner'))
```
Passing a **function** to `useState` (a lazy initial value) means it runs once, on the first render, to pick the starting mode. After that, only `setService` changes it.

```js
const [quantities, setQuantities] = useState({})

function updateQuantity(dishId, newQty) {
  setQuantities((prev) => ({ ...prev, [dishId]: newQty }))
}
```
- `prev` is the current object.
- `...prev` copies all of its keys into a new object.
- `[dishId]: newQty` overwrites one key. The square brackets mean "use the value of `dishId` as the key name".

A **new** object is always created, because React only re-renders when it gets a new value. Writing `quantities[6] = 2` would change the old object, and React wouldn't notice.

```js
const thali = getThali(quantities, service)
```
This is **derived data**: it's recalculated on every render, never stored. Storing it as well would create a second copy that could fall out of sync.

```jsx
<div data-service={service} className="min-h-screen bg-page text-fg transition-colors duration-500">
```
This one attribute drives the whole colour theme.

### `src/components/Header.jsx`

```js
const [menuOpen, setMenuOpen] = useState(false)
<button onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
```
The hamburger flips `menuOpen`, and its three bars rotate into an X with conditional classes.

The nav's classes are:
```
${menuOpen ? 'block' : 'hidden'} order-last basis-full md:order-none md:ml-auto md:block md:basis-auto
```
- **On phones** it's hidden unless the menu is open, and `order-last basis-full` drops it onto its own full-width row under the bar.
- **From `md:`** it's always visible and sits inline in the bar.

The header also renders `<ServiceToggle value={service} onChange={onServiceChange} />`, passing App's state straight through.

### `src/components/ServiceToggle.jsx`

This is a controlled switch. It reads `value` and calls `onChange('lunch' | 'dinner')`. The knob slides with `translate-x-full` when `isDinner` is true. `role="switch"` and `aria-checked` tell screen readers what it is and whether it's on.

### `src/components/Hero.jsx`

```js
const info = services[service]
```
Every piece of text that changes with the service comes from `info`: the pill, the intro paragraph, the badge and the ticker label.

- The "now serving" dot uses Tailwind's built-in `animate-ping`.
- "Tide" is outlined: `text-transparent [-webkit-text-stroke:2px_var(--color-fg)]`.
- The sun (lunch) or moon (dinner) is a circle whose classes switch with a ternary.
- The plate is three layered divs using the gradient utilities. The badge is an SVG with text wrapped round a circle.

### `src/components/Ticker.jsx`

The fish list is rendered **twice** and the strip slides left by 50%. When it has moved exactly one copy's width, the second copy sits where the first began, so the loop looks seamless. The duplicate has `aria-hidden` so screen readers skip it.

`min-w-0 overflow-hidden` stops the long strip from widening the page. `group` together with `group-hover:[animation-play-state:paused]` pauses it while you hover.

### `src/components/About.jsx`

- The postcard switches between the `postcard-day` and `postcard-night` gradients. The boat and the sail are its `before:` and `after:` shapes, cut out with `clip-path`.
- The quote sits under the postcard on phones. On `lg:` it becomes `absolute` and overlaps the postcard's corner.
- The timeline maps `dayTimeline`. `const isNow = step.service === service` highlights the 12 pm step at lunch and the 7 pm step at dinner. It's a vertical list on phones and five columns from `md:`.
- `<Wave className="text-page" />` draws a wavy edge in the next section's colour.

### `src/components/Menu.jsx` ⭐ main content

```js
const [course, setCourse]     = useState('starters')
const [vegOnly, setVegOnly]   = useState(false)
const [maxSpice, setMaxSpice] = useState(3)
```
These three states hold only the user's choices.

```js
const matches = (dish) =>
  isServed(dish, service) && (!vegOnly || dish.veg) && dish.spice <= maxSpice

const visibleDishes = dishes.filter((dish) => dish.course === course && matches(dish))
```
`matches` checks every filter except the course:

- `!vegOnly || dish.veg`: if veg-only is off, every dish passes; if it's on, only veg dishes pass.
- `dish.spice <= maxSpice`: slider at 1 means only dishes with spice 0 or 1.

`visibleDishes` then adds the course check. Both values are derived, never stored.

```js
const counts = {}
courses.forEach((c) => {
  counts[c.id] = dishes.filter((dish) => dish.course === c.id && matches(dish)).length
})
```
This counts how many dishes each tab *would* show with the current filters. Those are the small numbers on the tabs.

```jsx
<DishCard
  key={dish.id}
  dish={dish}
  quantity={quantities[dish.id] || 0}
  onQuantityChange={(newQty) => onQuantityChange(dish.id, newQty)}
/>
```
- `quantity`: dishes nobody has picked have no key yet, so `|| 0` turns `undefined` into `0`.
- `onQuantityChange`: a small arrow function that already knows which dish it belongs to, so the card doesn't need to know about ids.

`{visibleDishes.length === 0 && …}` shows an empty message with a **Reset filters** button. The phone-only bar uses `sticky bottom-4`: it sticks to the bottom of the screen only while you're scrolling past the dish list, then stops.

Layout: `grid lg:grid-cols-[1fr_340px]` puts the dishes on the left and the thali on the right on desktop. On phones the thali sits underneath.

### `src/components/MenuFilters.jsx`

A **fully controlled** filter bar. It has no state; each control receives a value and an `on…Change` function from Menu.

- **Tabs:** `onClick={() => onCourseChange(c.id)}`, with `aria-pressed` marking the active one.
- **Veg switch:** `onClick={() => onVegOnlyChange(!vegOnly)}`
- **Spice slider:** a controlled `<input>`:
  ```jsx
  <input type="range" min="0" max="3" value={maxSpice}
         onChange={(e) => onMaxSpiceChange(Number(e.target.value))} />
  ```
  `e.target.value` is always a **string** (`"2"`), so `Number()` converts it before it's stored. `accent-chili` colours the slider.

### `src/components/DishCard.jsx`

This displays one dish.

- The dotted line between name and price is an empty span with `flex-1 border-b-2 border-dotted`, so it fills the leftover space.
- Optional items use `&&`: `{dish.chefsPick && <span>Chef's pick</span>}`.
- When `quantity > 0`, the card gets a turmeric ring and "✓ On your leaf". This is styled from props, with no state.
- It passes `value={quantity}` and `onChange={onQuantityChange}` down to `PortionStepper`.

### `src/components/PortionStepper.jsx` ⭐ controlled component

See [section 7](#7-how-the-controlled-components-work).

### `src/components/Thali.jsx`

This only **displays** `thali` (`{ items, plates, total }`).

**Placing the bowls round the leaf:**
```js
const angle = (i / items.length) * 2 * Math.PI - Math.PI / 2   // start at 12 o'clock
const x = 50 + 33 * Math.cos(angle)
const y = 50 + 33 * Math.sin(angle)
<span style={{ left: `${x}%`, top: `${y}%` }} className="… transition-all duration-500 motion-safe:animate-pop" />
```
- Bowl `i` of `n` gets an equal slice of the circle: `cos` gives the horizontal position and `sin` the vertical one.
- 50% is the centre and 33% is the radius.
- When a bowl is added, the others **slide** to their new places (`transition-all`), and the new one **pops** in.

**Why `style` and not Tailwind?** Tailwind finds classes by reading the source code before the site runs. A value worked out at runtime, such as `left-[37.4%]`, never appears in the code, so its CSS would never be generated. Calculated numbers go in `style`.

**The same reason explains `bowlStyle`.** It's a lookup of **complete** class strings (`'bg-chili text-paper'`) rather than something like `` `bg-${colour}` ``.

### `src/components/Reserve.jsx`

```js
const [guests, setGuests]       = useState(2)
const [seating, setSeating]     = useState('')
const [tableId, setTableId]     = useState(null)
const [submitted, setSubmitted] = useState(false)
```

**The seating is derived and self-correcting:**
```js
const options = seatings[service]
const activeSeating =
  options.find((s) => s.time === seating && !s.full)?.time
  ?? options.find((s) => !s.full).time
```
If the stored seating isn't valid for the current service (for example, you picked 12:30 pm and then switched to dinner), it falls back to the first free seating.

- `?.` (optional chaining) returns `undefined` instead of crashing when `.find()` finds nothing.
- `??` (nullish coalescing) means "if the left side is undefined or null, use the right side".

**The chosen table is validated on every render:**
```js
const picked = tables.find((t) => t.id === tableId)
const chosenTable = picked && !booked.includes(picked.id) && picked.seats >= guests ? picked : null
```
Pick T4 (4 seats) and then raise guests to 5, and `chosenTable` becomes `null` straight away. The map un-highlights it and the button says "Pick a table first". No extra code or effect is needed, because the value is recalculated from current state every time.

- **Guests:** `<PortionStepper value={guests} onChange={setGuests} min={1} max={6} label="Guests" />` is the same component as on the dish cards. Passing `setGuests` directly works because the stepper calls `onChange(newNumber)`.
- **`handleSubmit`:** `event.preventDefault()` stops the browser reloading the page. Name, phone and date have `required`, so the browser checks them first. Then `setSubmitted(true)` shows the "Received" stamp.
- **The ticket stub** reads `guests`, `activeSeating`, `chosenTable` and the `thali` prop, so it updates live.
- **The notches:** the stub's `before:` and `after:` are dark circles half outside the stub, and `overflow-hidden` on the ticket clips them into half-moons.
- **Name, phone and date are uncontrolled.** Nothing reads them until submit, so they don't need state. In Week 3, when they're sent to a backend, they'd get `value` and `onChange`.

### `src/components/SeatMap.jsx`

A **controlled** floor plan. It receives `selectedId` and calls `onSelect(id)`.

```js
function statusOf(table) {
  if (booked.includes(table.id)) return 'booked'
  if (table.seats < guests) return 'small'
  if (table.id === selectedId) return 'selected'
  return 'free'
}
```
- The status picks the styles from the `look` object and sets `disabled` on taken or too-small tables.
- Each table is a `<button>` placed with `style={{ left, top, width }}` in percentages and centred with `-translate-x-1/2 -translate-y-1/2`.
- `Chairs` draws `seats / 2` dots above and below the table, using `Array.from({ length: count }, …)` to make an array of that length to `.map` over.
- Each table has a full `aria-label` such as "Table T5, 6 seats, Courtyard, available", so the map works with a screen reader.

### `src/components/Footer.jsx`

Maps `hours` into table rows. The grid goes from 1 column to 2 at `sm:` to 3 at `lg:`. `[overflow-wrap:anywhere]` lets the long email address wrap instead of causing sideways scroll at 320px.

### `src/components/ui.jsx`

Small pieces used in several places:

- `Container`: centred, max width, side padding. It takes `children` and extra `className`s.
- `Eyebrow`: the small uppercase label with a line drawn by `before:`.
- `DietMark`: the Indian veg (green dot) or non-veg (brown triangle) symbol.
- `SpiceMeter`: three bars, filled up to the dish's spice level.
- `Wave`: an SVG divider whose colour comes from `text-*`, because the path uses `fill="currentColor"`.

---

## 6. How useState works here

```js
const [vegOnly, setVegOnly] = useState(false)
```
1. `useState(false)` asks React to remember a value, starting at `false`.
2. It gives back the current value (`vegOnly`) and a setter (`setVegOnly`).
3. Calling `setVegOnly(true)` stores the new value **and re-runs the component function**.
4. On that re-run, `vegOnly` is `true`, so `visibleDishes` is recalculated and the grid shows only veg dishes.

**Rule I followed:** state holds only what the user chose. Everything that can be calculated from it is worked out on each render and never stored:

| State (stored) | Derived (calculated each render) |
|---|---|
| `course`, `vegOnly`, `maxSpice`, `service` | `visibleDishes`, `counts` |
| `quantities`, `service` | `thali` (items, plates, total) |
| `seating`, `service` | `activeSeating`, `booked` |
| `tableId`, `guests`, `booked` | `chosenTable` |

---

## 7. How the controlled components work

A **controlled component** has no state of its own. The parent passes in:

- **`value`**: what to show
- **`onChange`**: a function to call when the user wants something different

The component displays `value` and reports changes; the **parent decides** what to store.

### PortionStepper, step by step

What happens when you press **+** on *Meen Oota*, currently at 1:

```
PortionStepper  calls  onChange(2)
     ↓  (that onChange is DishCard's onQuantityChange)
DishCard        calls  (newQty) => onQuantityChange(10, newQty)   from Menu
     ↓  (Menu just passes App's function through)
App             runs   updateQuantity(10, 2)
                       setQuantities(prev => ({ ...prev, 10: 2 }))
     ↓  state changed → App re-renders
App             thali = getThali(...)   → new bowl, new total
     ↓  props flow back down
DishCard        gets quantity={2} → ring + "On your leaf"
PortionStepper  gets value={2}    → shows 2
Thali           gets new thali    → bowl pops in, bill updates
Reserve         gets new thali    → ticket shows the pre-order
```
**Data goes down as props, and changes go up as function calls.**

### Why the stepper doesn't have its own `useState`

If each stepper stored its own count:

1. The thali and the ticket couldn't see the numbers, so there'd be no total.
2. Switching tabs removes the cards from the page, so their counts would be lost.
3. It couldn't be reused for guests, because Reserve needs to read that number for the seat map.

Because it's controlled, the same component works for **plates per dish** (min 0, max 9) and **number of guests** (min 1, max 6). `disabled={value <= min}` and `disabled={value >= max}` stop it going out of range.

The other controlled components follow the same pattern: `ServiceToggle` (value + onChange), `MenuFilters` (three value/onChange pairs), `SeatMap` (selectedId + onSelect) and the spice `<input type="range">`.

---

## 8. Tailwind patterns used

| Pattern | Meaning | Example |
|---|---|---|
| Mobile-first | Unprefixed = all screens; `sm:` 640px+, `md:` 768px+, `lg:` 1024px+ | `grid gap-6 sm:grid-cols-2` |
| Show/hide by size | | `hidden md:block`, `lg:hidden` |
| Theme tokens | Classes made from `@theme` variables | `bg-page text-fg border-line` |
| Opacity | `/90` = 90% opacity | `bg-page/90`, `text-cream/80` |
| Arbitrary values | Any CSS value in `[]`; `_` stands for a space | `lg:grid-cols-[1fr_340px]`, `w-[calc(50%-4px)]` |
| Arbitrary properties | A whole CSS declaration | `[overflow-wrap:anywhere]` |
| Pseudo-elements | Replace `::before` / `::after` | `before:content-['✓'] before:text-turmeric` |
| State variants | | `hover:`, `focus:`, `disabled:`, `enabled:hover:` |
| Group hover | Style a child when its parent is hovered | `group` + `group-hover:bg-turmeric` |
| Motion safety | Animate only if the user allows motion | `motion-safe:animate-pop` |
| Screen-reader only | Hidden visually, still read aloud | `sr-only` |
| Conditional classes | A ternary inside a template string | `` `${vegOnly ? 'bg-leaf' : 'bg-line'}` `` |

**Avoiding horizontal scroll:**
- `min-w-0` on flex and grid children so they can shrink.
- `overflow-hidden` on the ticker and on the seat map.
- Percentage-based positions on the floor plan.
- Wrapping long links.
- Rows of controls use `flex-wrap`.

---

## 9. Likely assessment questions

**What does useState do?**
It gives a component memory between renders. Calling the setter stores the new value and makes React re-run the component, so the page updates.

**How does your filter work?**
Three states (`course`, `vegOnly`, `maxSpice`) store the choices. On every render, `dishes.filter(...)` keeps the dishes that pass all the checks, and `.map()` turns them into cards.

**Why isn't `visibleDishes` in state?**
Because it can always be calculated from the filter state. Storing it too would create two copies of the same information that could disagree.

**What makes PortionStepper controlled?**
It has no state. It shows `value` and calls `onChange(newNumber)`; the parent decides what to store.

**Why are quantities in App and not Menu?**
The ticket in `Reserve` also shows the thali, and App is the closest parent of both.

**Why `{ ...prev, [id]: qty }`?**
React only notices a new object, so I copy the old one and change one key. I never mutate state.

**What is `key` for?**
It lets React match list items between renders. It must be unique and stable, so I use `dish.id`.

**How does dinner mode change the colours?**
App sets `data-service="dinner"`, and a CSS rule redefines the colour variables. Every `bg-page` and `text-fg` class updates by itself.

**What happens if I pick a table and then add guests?**
`chosenTable` is recalculated on every render. If the table is now too small, it becomes `null`, the map un-highlights it, and the button asks you to pick again.

**Why do the bowls use `style` instead of classes?**
Their positions are calculated at runtime. Tailwind only generates classes it can see written in the source code.

---

## 10. Commit plan

Small, real commits, each one typed and tested:

1. `Scaffold Vite + React app`
2. `Remove Vite demo files and old styles.css`
3. `Install Tailwind and add brand colour and font tokens`
4. `Add Container, Eyebrow and DietMark helpers`
5. `Build Header with mobile menu state`
6. `Build Hero and Today's Catch ticker`
7. `Build About section with timeline`
8. `Move dishes into src/data/menu.js`
9. `Render menu grid from data with DishCard`
10. `Add course tabs and veg filter with useState`
11. `Add spice slider filter and tab counts`
12. `Add PortionStepper controlled component`
13. `Lift quantities to App and add getThali helper`
14. `Build Thali leaf with bowls and bill`
15. `Add lunch/dinner theme tokens and ServiceToggle`
16. `Split menu by service and make text service-aware`
17. `Add floor plan data and SeatMap component`
18. `Build reservation ticket with seat-map booking`
19. `Reuse PortionStepper for guest count`
20. `Add footer and wave dividers`
21. `Fix overflow at 320px and contrast in dinner mode`
