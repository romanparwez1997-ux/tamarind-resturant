# Tamarind & Tide: code walkthrough

A guide for presenting Assignment 3: what each part of the code does, in the order I'd show it.

---

## 1. The project in 30 seconds

Tamarind & Tide is a restaurant website. In Week 2 it was a React + Tailwind site with all its data hardcoded.
This week it got a real backend:

| Part | Technology | Folder |
|---|---|---|
| Frontend | React + Vite + Tailwind | `client/` |
| Backend API | Node.js + Express | `server/` |
| Database | Postgres on Neon | tables defined in `server/db/schema.sql` |
| Login | Better Auth (email + password, cookie sessions) | `server/src/auth.js` |
| Hosting | Vercel: frontend and backend as two services in one project | `vercel.json` |

**What a visitor can do:** browse the menu (loaded from the database), create an account, sign in, stay signed in
after a refresh, book a real table with a thali pre-order, see their upcoming bookings, and cancel them.

---

## 2. The big picture

```
                        ┌──────────────────────── one website address ───────────────────────┐
                        │                                                                     │
  Browser  ──── /  ───► │  client service   (React app, built by Vite)                        │
     │                  │                                                                     │
     └──── /api/* ────► │  server service   (Express: server/src/index.js)                    │
                        │      ├─ /api/auth/*      → Better Auth (sign up, sign in, sessions) │
                        │      ├─ /api/dishes      → routes/dishes.js                         │
                        │      ├─ /api/tables      → routes/tables.js                         │
                        │      └─ /api/bookings/*  → routes/bookings.js                       │
                        └──────────────────────────────────┬──────────────────────────────────┘
                                                           │  SQL through a connection pool (pg)
                                                           ▼
                                                   Neon Postgres database
```

**Key point:** the browser only ever talks to **one address**. Requests starting with `/api` go to Express,
and everything else goes to React. Locally, Vite's dev server does this forwarding; live, `vercel.json` does it.
Because the site and the API share an address, the login cookie is a normal first-party cookie, so browsers don't block it.

---

## 3. Folder structure

```
tamarind-and-tide/
├─ vercel.json             tells Vercel: build client/ and server/, send /api/* to the server
├─ .gitignore              keeps node_modules, dist and every .env out of git
│
├─ client/                 FRONTEND
│  ├─ vite.config.js       local dev proxy: /api/* → http://localhost:3000
│  └─ src/
│     ├─ App.jsx           top of the app: loads the menu, knows who is signed in
│     ├─ lib/api.js        one function per API route
│     ├─ lib/authClient.js Better Auth's browser helper
│     ├─ components/       Header, Menu, Reserve, AuthDialog, …
│     └─ data/             fixed text only (labels, opening hours)
│
└─ server/                 BACKEND
   ├─ .env                 secrets (NOT in git)
   ├─ .env.example         names of the secrets, no values (in git)
   ├─ db/
   │  ├─ schema.sql        all the tables
   │  ├─ migrate.js        runs schema.sql
   │  ├─ seed-data.js      the Week 2 arrays (14 dishes, 9 tables)
   │  └─ seed.js           puts seed-data.js into the database
   └─ src/
      ├─ index.js          builds the Express app
      ├─ db.js             database connection pool
      ├─ auth.js           Better Auth setup
      ├─ middleware/requireAuth.js   "you must be signed in" guard
      └─ routes/           dishes.js, tables.js, bookings.js
```

**Why `server/db/` and `server/src/` are separate:** `src/` is the app that runs all the time.
`db/` holds scripts I run once, by hand, to set up and fill the database.

---

## 4. The database

### 4.1 Tables in plain English

```
 user ──< session              one user can be signed in on many browsers
  │  └──< account              one user has a login method (email + hashed password)
  │
  └──< bookings >── dining_tables          each booking belongs to one user and one table
           │
           └──< booking_items >── dishes   each booking can pre-order many dishes
```
`──<` means "one to many".

**Better Auth's tables.** The library reads and writes these; my code doesn't.

| Table | One row is… | Important columns |
|---|---|---|
| `user` | a person who signed up | `id`, `name`, `email` (unique) |
| `session` | one signed-in browser | `token` (stored in the cookie), `expiresAt`, `userId` |
| `account` | how that user logs in | `password` holds a **hash**, never the real password |
| `verification` | a short-lived code (e.g. password reset) | required by Better Auth |

**My tables:**

| Table | One row is… | Important columns |
|---|---|---|
| `dishes` | a dish on the menu | `name`, `course`, `service` (lunch/dinner/both), `veg`, `price`, `spice` 0–3 |
| `dining_tables` | a table in the restaurant | `id` ('T1'…'T9'), `seats`, `zone`, `x`/`y` (where to draw it) |
| `bookings` | a reservation | `user_id`, `table_id`, `booking_date`, `seating`, `guests`, `name`, `phone` |
| `booking_items` | one dish pre-ordered with a booking | `booking_id`, `dish_id`, `qty` |

### 4.2 Rules the database enforces itself (`schema.sql`)

```sql
spice INTEGER NOT NULL CHECK (spice BETWEEN 0 AND 3)          -- no spice level 7
user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE -- booking must belong to a real user
UNIQUE (table_id, booking_date, seating)                        -- no double bookings, ever
```
- **`CHECK`**: rejects impossible values.
- **`REFERENCES`** (foreign key): a booking can't point at a user or table that doesn't exist.
- **`ON DELETE CASCADE`**: delete a booking and its items go too; delete a user and their sessions and bookings go too.
- **`UNIQUE`**: even if two people click "Request table" at the same instant, only one booking is saved.

### 4.3 Creating and filling the tables

```bash
npm run db:migrate   # runs schema.sql → creates the tables
npm run db:seed      # runs seed.js    → inserts 14 dishes and 9 tables
```

`schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so running migrate twice does no harm.

`seed.js` loops over the Week 2 arrays and *upserts* each row:
```js
INSERT INTO dishes (id, name, …) VALUES ($1, $2, …)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, …
```
"If this dish id already exists, update it instead." Running seed twice therefore never creates duplicates.

---

## 5. The backend, file by file

### 5.1 `server/package.json`: scripts
```json
"dev":        "node --watch --env-file-if-exists=.env src/index.js",
"db:migrate": "node --env-file-if-exists=.env db/migrate.js",
"db:seed":    "node --env-file-if-exists=.env db/seed.js"
```
- `--env-file-if-exists=.env` is built into Node: it loads `server/.env` into `process.env`, so no `dotenv` package is needed.
- `--watch` restarts the server whenever a file is saved.

Dependencies: just **3**. `express` (web server), `pg` (talks to Postgres), `better-auth` (login).

### 5.2 `server/src/db.js`: the database connection
```js
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
```
- A **pool** keeps a few connections to Neon open and lends one to each query, which is faster than reconnecting every time.
- Every query uses **placeholders**: `pool.query('… WHERE id = $1', [id])`. The values travel separately from the SQL,
  which makes **SQL injection impossible**.

### 5.3 `server/src/index.js`: the Express app
The order matters:
```js
const app = express()

app.all('/api/auth/*splat', toNodeHandler(auth))  // 1. login routes → Better Auth
app.use(express.json())                           // 2. turn JSON bodies into req.body

app.get('/api/health', …)                         // 3. my routes
app.use('/api/dishes', dishesRouter)
app.use('/api/tables', tablesRouter)
app.use('/api/bookings', bookingsRouter)

app.use((req, res) => res.status(404).json(…))    // 4. unknown route → 404
app.use((err, req, res, next) => { … 500 … })     // 5. any crash → log it, send a safe message

app.listen(process.env.PORT || 3000)
```
- **Better Auth comes before `express.json()`** because it reads the raw request body itself.
- **The error handler** logs the real error on the server and sends the browser only "Something went wrong", so internal details never leak.
- **`/api/health`** reports whether the database connects, the tables exist and the settings are present. It shows true/false only, never the secret values.

### 5.4 `server/src/auth.js`: login setup
```js
export const auth = betterAuth({
  database: pool,                                // same database as everything else
  secret: process.env.BETTER_AUTH_SECRET,        // signs the session cookie
  baseURL: process.env.BETTER_AUTH_URL,          // the site's public address
  trustedOrigins: [process.env.BETTER_AUTH_URL], // reject logins coming from other websites
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  session: { expiresIn: 60 * 60 * 24 * 7 },      // stay signed in for 7 days
})
```
Better Auth handles password hashing, sessions and cookies, so I don't write my own security code.

### 5.5 `server/src/middleware/requireAuth.js`: the guard
```js
const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
if (!session) return res.status(401).json({ error: 'Please sign in first.' })
req.user = session.user
next()
```
Placed in front of a route (`router.post('/', requireAuth, handler)`), it reads the cookie, finds the user, and either
stops with **401** or hands `req.user` to the route.

### 5.6 `server/src/routes/dishes.js` and `tables.js`: reading data
```js
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, …, chefs_pick AS "chefsPick", tag FROM dishes ORDER BY id`)
  res.json(rows)
})
```
`chefs_pick AS "chefsPick"` renames the database column so the JSON has exactly the same shape as the old hardcoded
array. That's why the React card components didn't need to change at all.

### 5.7 `server/src/routes/bookings.js`: the main feature

| Route | Signed in? | What it does |
|---|---|---|
| `GET /taken?date=…&seating=…` | no | ids of tables already booked (no personal info) |
| `GET /mine` | **yes** | my upcoming bookings, with thali plates and total |
| `POST /` | **yes** | make a booking |
| `DELETE /:id` | **yes** | cancel *my* booking |

**Creating a booking (`POST /`) in 4 steps:**

1. **Validate everything again on the server.** The browser can't be trusted:
   ```js
   if (!isValidDate(date) || date < today()) return res.status(400).json({ error: 'Pick a date from today onwards.' })
   if (found[0].seats < guests) return res.status(400).json({ error: 'That table is too small for your party.' })
   ```
2. **Owner comes from the session, never from the request:** `req.user.id`, so nobody can book as someone else.
3. **A transaction** saves the booking and its thali items together:
   ```js
   await client.query('BEGIN')
   INSERT INTO bookings …        -- the booking
   INSERT INTO booking_items …   -- one row per pre-ordered dish
   await client.query('COMMIT')  // all saved, or on error: ROLLBACK (nothing saved)
   ```
4. **Database errors become friendly messages:**
   ```js
   if (err.code === '23505') return res.status(409).json({ error: 'Sorry, someone just booked that table.' })
   ```
   `23505` is Postgres's code for "the UNIQUE rule was broken", i.e. the table was taken a moment ago.

**Cancelling:**
```sql
DELETE FROM bookings WHERE id = $1 AND user_id = $2
```
`AND user_id = $2` means you can only cancel your own bookings, even if you guess someone else's id.

**`GET /mine`** uses a `LEFT JOIN` to `booking_items` and `dishes` and a `SUM` to add up each booking's thali.
The `LEFT JOIN` also keeps bookings that have no thali.

**Status codes used:** `200` OK, `201` created, `204` deleted, `400` bad input, `401` not signed in,
`404` not found, `409` conflict (table taken), `500` server error.

---

## 6. How login works, end to end

**Sign up**
1. `AuthDialog.jsx` calls `authClient.signUp.email({ name, email, password })`.
2. That sends `POST /api/auth/sign-up/email`.
3. Better Auth hashes the password and creates a `user`, an `account` and a `session` row.
4. The response sets an **httpOnly cookie** holding the session token. JavaScript can't read it, so a malicious script can't steal it.
5. `useSession()` notices, and the header switches to "Hi, Name · Sign out".

**Refreshing the page:** the cookie is still in the browser. On load, `useSession()` calls `GET /api/auth/get-session`,
the browser sends the cookie, and Better Auth finds the matching `session` row, so you're still signed in.

**Sign out:** `authClient.signOut()` → `POST /api/auth/sign-out` deletes the session row and clears the cookie.

**Protected routes:** `requireAuth` (section 5.5).

**Other websites:** Better Auth checks the `Origin` header against `trustedOrigins`, so a fake site can't log you in or out.

---

## 7. The frontend: what changed from Week 2

### 7.1 `client/src/lib/api.js`: one place for all API calls
```js
async function request(path, options = {}) {
  const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', … } })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}
export const getDishes = () => request('/api/dishes')
export const createBooking = (booking) => request('/api/bookings', { method: 'POST', body: JSON.stringify(booking) })
```
Components never write `fetch` themselves. If the server sends `{ error: '…' }`, `request` turns it into a normal
JavaScript error that components can `catch` and show.

### 7.2 `client/src/App.jsx`: loading the menu and the session
```js
const [dishes, setDishes] = useState([])
const [menuStatus, setMenuStatus] = useState('loading')

useEffect(() => {
  getDishes()
    .then((data) => { setDishes(data); setMenuStatus('ready') })
    .catch(() => setMenuStatus('error'))
}, [])                                   // [] = run once, after the first render

const { data: session, isPending } = authClient.useSession()
const user = session?.user ?? null       // null when signed out
```
- `dishes` used to be `import { dishes } from './data/menu'`. Now it comes from the database.
- `menuStatus` lets the menu show "Loading the menu…" or an error instead of an empty grid.
- `user` is passed down as a prop to `Header` and `Reserve`.

### 7.3 `Header.jsx`: signed-in state
- Signed out: **Sign in** button, which opens the popup.
- Signed in: **Hi, Asha · Sign out**.
- While the session check is still running, it shows nothing, so "Sign in" never flashes up for someone who is signed in.

### 7.4 `AuthDialog.jsx`: sign-in / create-account popup
- Uses the browser's own `<dialog>` element, which gives a backdrop, focus trapping and Esc-to-close for free.
- One form, two modes (`signIn` / `signUp`), with controlled inputs in `useState`.
- Shows Better Auth's error message, e.g. "Invalid email or password".

### 7.5 `Menu.jsx`
Same filters as Week 2. It now receives `dishes` as a prop and shows loading / error text.

### 7.6 `Reserve.jsx`: real bookings
State is split into three groups:
```js
// the user's choices   → guests, seating, date, tableId
// data from the API    → tables, taken, myBookings
// the request          → busy, error, confirmed
```
- **Floor plan:** `useEffect(..., [])` loads the 9 tables once.
- **Taken tables:** `useEffect(loadTaken, [date, activeSeating])` reloads whenever the date or seating changes.
  An `ignore` flag stops an old, slow response overwriting a newer one.
- **My bookings:** reload whenever the signed-in user changes.
- **Submit:** if signed out, it opens the sign-in popup; otherwise it calls `createBooking(...)` with the thali items,
  shows the "Booked" stamp, then refreshes the map and the list.
- **Cancel:** calls `cancelBooking(id)`, clears the stamp if it was showing that booking, then refreshes.
- **`chosenTable` is derived, not stored:** it's recalculated on every render, so if the table becomes taken or
  too small it un-selects itself with no extra code.

---

## 8. Secrets

| Secret | What it is | Where it lives |
|---|---|---|
| `DATABASE_URL` | address + password of the Neon database | `server/.env` locally, Vercel Environment Variables live |
| `BETTER_AUTH_SECRET` | random string that signs session cookies | same |
| `BETTER_AUTH_URL` | the site's public address (not secret, but required) | same |

- `.gitignore` contains `.env`, `.env.*` and `!.env.example`.
- Proof it was never committed: `git log --all -- server/.env` prints nothing.
- `server/.env.example` is committed. It lists the names only, so anyone can set the project up.
- The React app contains **no** secrets. Anything in frontend code is visible to every visitor.

---

## 9. Deployment

**`vercel.json`** (repo root):
```json
"services": {
  "client": { "root": "client", "framework": "vite" },
  "server": { "root": "server", "framework": "express" }
},
"rewrites": [
  { "source": "/api/(.*)", "destination": { "service": "server" } },
  { "source": "/(.*)",     "destination": { "service": "client" } }
]
```
- Vercel builds two services from one repo: the React site and the Express API.
- `/api/...` goes to Express (which still sees the full path `/api/dishes`); everything else goes to React.
- The Express app runs as a Vercel Function, and the three variables are set in Vercel's Environment Variables.

**Locally** the same split is done by `client/vite.config.js`:
```js
server: { proxy: { '/api': 'http://localhost:3000' } }
```
```bash
cd server && npm run dev    # API  → http://localhost:3000
cd client && npm run dev    # site → http://localhost:5173
```

---

## 10. Demo script (about 5 minutes)

1. **Open the site.** "The menu you see is coming from Postgres." Open `/api/dishes` in a new tab to show the raw JSON.
2. **Open Neon → Tables → `dishes`.** Same 14 rows.
3. **Click "Book a table" while signed out.** The button says "Sign in to book", so booking is protected.
4. **Create an account.** The header changes to "Hi, Name · Sign out". In Neon, show the new rows in `user` and `session`, and the hashed `password` in `account`.
5. **Refresh the page.** Still signed in, because of the cookie and the session row.
6. **Add two dishes to the thali, pick a table, book.** Show the "Booked" stamp, then the new rows in `bookings` and `booking_items`.
7. **Look at the map.** That table now shows as taken. Optionally, a second account trying the same table gets "someone just booked that table".
8. **Cancel the booking.** The stamp clears and the rows disappear from Neon.
9. **Sign out and refresh.** Still signed out.
10. **Show `git log --all -- server/.env`.** Empty: secrets were never committed.

---

## 11. Questions I might be asked

**Walk me through your folder structure.**
Two apps in one repo: `client/` is the React site, `server/` is the Express API. Inside the server, `src/index.js`
builds the app, `db.js` is the database connection, `auth.js` sets up login, and the routes are in `routes/`.
`db/` holds the schema and the seed script.

**How is your database connected?**
`db.js` creates a `pg.Pool` from `DATABASE_URL`. Every route imports `pool` and runs SQL with `pool.query`.
Better Auth is given the same pool.

**How does your auth work?**
Better Auth hashes passwords and stores sessions in Postgres. On login it sets an httpOnly cookie with the session
token. Every request sends that cookie; `requireAuth` asks Better Auth who it belongs to.

**Why does the session survive a refresh?**
The cookie stays in the browser, and the session row stays in the database for 7 days. `useSession()` re-checks it on load.

**What stops someone booking as another user?**
The user id comes from the session (`req.user.id`), never from the request body.

**What if two people book the same table at once?**
`UNIQUE (table_id, booking_date, seating)` lets only one INSERT succeed. The other gets error `23505`, which I return as `409`.

**What's a transaction?**
A group of queries that all succeed or all fail. A booking plus its thali items is saved as one transaction.

**Why validate on the server if the form already checks things?**
Anyone can send a request without using my form, e.g. with curl. The server is the only place I control.

**What's SQL injection and how do you prevent it?**
Inserting SQL through user input. I always use `$1, $2` placeholders, so input is treated as data, never as SQL.

**Why is `express.json()` after the auth handler?**
Better Auth reads the request body itself. If `express.json()` ran first, the body would already be used up.

**Why is the frontend and backend on one domain?**
So the session cookie is first-party. Cookies from a different domain are third-party and browsers block them.

**What did the seed script do with your Week 2 data?**
It moved the hardcoded `dishes` and `tables` arrays into the database. React now fetches them from `/api/dishes` and `/api/tables`.
