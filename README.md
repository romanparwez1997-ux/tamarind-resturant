# Tamarind & Tide: full stack

Assignment 3: my React + Tailwind restaurant site now has a real backend behind it.

- **Frontend:** Vite + React + Tailwind (`client/`)
- **Backend:** Node.js + Express (`server/`)
- **Hosting:** both on **Vercel**, as two *services* in one project (`vercel.json`)
- **Database:** Postgres on **Neon**, queried with the `pg` library (plain SQL)
- **Auth:** **Better Auth** with email + password and cookie sessions

Live site: `https://YOUR-SITE.vercel.app` · API: `https://YOUR-SITE.vercel.app/api/dishes`

No TypeScript. Frontend details from Assignment 2 are in [docs/week2-frontend.md](docs/week2-frontend.md).

---

## Contents

1. [Assignment checklist](#1-assignment-checklist)
2. [Folder structure](#2-folder-structure)
3. [How a request travels](#3-how-a-request-travels)
4. [The database schema in plain English](#4-the-database-schema-in-plain-english)
5. [How auth works](#5-how-auth-works)
6. [API routes](#6-api-routes)
7. [Running it locally](#7-running-it-locally)
8. [Deploying (Neon → Vercel)](#8-deploying-neon--vercel)
9. [Likely assessment questions](#9-likely-assessment-questions)

---

## 1. Assignment checklist

| Requirement | Where |
|---|---|
| Split into client and server | `client/` (React) and `server/` (Express), each with its own `package.json` |
| Free Postgres database + schema | Neon. All tables are in `server/db/schema.sql`, created by `npm run db:migrate` |
| Users table handled by the auth library | `user`, `session`, `account`, `verification` in `schema.sql`, used by Better Auth |
| Product/items table | `dishes` (the menu), plus `dining_tables`, `bookings`, `booking_items` |
| Secrets in `.env`, never committed | `server/.env` (git-ignored by the root `.gitignore`); `server/.env.example` shows the names only |
| Week 2 hardcoded data moved into the DB with a seed script | Arrays moved to `server/db/seed-data.js`; `npm run db:seed` runs `server/db/seed.js` |
| At least one API route returning JSON | `GET /api/dishes` (and 6 more, see [§6](#6-api-routes)) |
| Real signup / login / sessions | Better Auth (`server/src/auth.js`), popup in `client/src/components/AuthDialog.jsx` |
| UI reflects signed-in state | Header shows **Sign in**, or **Hi, Asha · Sign out**; booking button says **Sign in to book** |
| Sessions survive a refresh | Session token lives in an httpOnly cookie; `useSession()` re-checks it on load |
| React uses the real API | `client/src/lib/api.js`; `App.jsx` fetches dishes, `Reserve.jsx` fetches tables and bookings |
| Live on the internet | Vercel (frontend + backend, one project) + Neon (database) |

---

## 2. Folder structure

```
tamarind-and-tide/
├─ .gitignore                 ignores node_modules, dist and every .env
├─ vercel.json                deploys client/ and server/ together; /api/* → server, rest → client
├─ README.md                  this file
├─ docs/week2-frontend.md     the Assignment 2 write-up (components, state, Tailwind)
│
├─ client/                    THE FRONTEND (Vite + React + Tailwind)
│  ├─ vite.config.js          dev proxy: /api/* → http://localhost:3000
│  └─ src/
│     ├─ App.jsx              fetches the menu, holds the session, opens the sign-in popup
│     ├─ lib/
│     │  ├─ api.js            one function per API route (getDishes, createBooking …)
│     │  └─ authClient.js     Better Auth's React client (useSession, signIn, signUp, signOut)
│     ├─ components/
│     │  ├─ AuthDialog.jsx    NEW: sign-in / create-account popup
│     │  ├─ Header.jsx        now shows Sign in / Sign out
│     │  ├─ Menu.jsx          now gets dishes as a prop (plus loading / error text)
│     │  ├─ Reserve.jsx       now loads tables + taken tables, saves bookings, lists "your bookings"
│     │  └─ …                 everything else is unchanged from Week 2
│     └─ data/                only fixed text and labels are left here
│
└─ server/                    THE BACKEND (Node + Express)
   ├─ .env.example            which secrets are needed (copy to .env)
   ├─ package.json            scripts: dev, start, db:migrate, db:seed
   ├─ db/
   │  ├─ schema.sql           every table: CREATE TABLE IF NOT EXISTS …
   │  ├─ migrate.js           runs schema.sql against the database
   │  ├─ seed-data.js         the Week 2 dishes + tables arrays
   │  └─ seed.js              inserts seed-data.js into the database
   └─ src/
      ├─ index.js             creates the Express app, mounts auth + routes, listens on PORT
      ├─ db.js                the Postgres connection pool
      ├─ auth.js              Better Auth setup
      ├─ middleware/
      │  └─ requireAuth.js    blocks a route unless there's a valid session
      └─ routes/
         ├─ dishes.js         GET /api/dishes
         ├─ tables.js         GET /api/tables
         └─ bookings.js       taken tables, my bookings, create, cancel
```

**Why `db/` and `src/` are separate in the server:** `src/` is the app that runs on Vercel.
`db/` holds one-off scripts I run by hand to set up or refill the database.

---

## 3. How a request travels

```
 Browser (https://my-site.vercel.app)
    │  fetch('/api/dishes')                      same site, so the cookie is sent
    ▼
 Vercel ── vercel.json: /api/* ──► "server" service: Express (server/src/index.js)
                                      │  app.use('/api/dishes', dishesRouter)
                                      ▼
                                   routes/dishes.js
                                      │  pool.query('SELECT … FROM dishes')
                                      ▼
                                   Neon Postgres
                                      │  rows
                                      ▼
                                   res.json(rows)  ──►  back to the browser as JSON
```

Every other path (`/`, `/assets/…`) goes to the `client` service, which serves the built React files.
Locally it's the same, except Vite's dev server (`vite.config.js`) does the `/api` forwarding.

**Why one domain for both?** The site and the API share an address, so the login cookie is a normal
*first-party* cookie. If the API lived on a different website, its cookie would be *third-party*, and browsers
(Safari especially) block those, so you'd be logged out on every refresh. It also means no CORS setup is needed.

---

## 4. The database schema in plain English

All of it is in [`server/db/schema.sql`](server/db/schema.sql).

```
 user ──< session            one user can be logged in on many browsers
  │  └──< account            one user has a login method (email + hashed password)
  │
  └──< bookings >── dining_tables     a booking is made by one user, for one table
           │
           └──< booking_items >── dishes     a booking can pre-order many dishes
```
(`──<` means "one to many".)

**Auth tables (Better Auth fills these in, I don't write to them):**

- **`user`**: one row per person who signed up: id, name, email (unique).
- **`session`**: one row per signed-in browser. `token` is what's stored in the cookie; `expiresAt` is 7 days later. Signing out deletes the row.
- **`account`**: how the user logs in. For email login, `password` holds a **hash**, never the real password.
- **`verification`**: short-lived codes (e.g. password reset). Required by Better Auth even if unused.

**My tables:**

- **`dishes`**: the menu. Each row is one dish with its price (whole rupees), course, lunch/dinner/both, veg, spice 0–3, and an optional tag. `CHECK` rules stop bad data, e.g. spice must be 0–3.
- **`dining_tables`**: the 9 tables in the room: how many seats, which zone, and where to draw it on the floor plan (`x`, `y` in %).
- **`bookings`**: a reservation. It links to the **user** who made it and the **table** booked, plus date, seating, guests and contact details. `UNIQUE (table_id, booking_date, seating)` means the database itself refuses a double booking.
- **`booking_items`**: the thali pre-ordered with a booking: one row per dish with how many plates. It's a *join table* between bookings and dishes.

**Foreign keys** (`REFERENCES`) make sure a booking can't point at a user or table that doesn't exist.
`ON DELETE CASCADE` means deleting a booking also deletes its items, and deleting a user deletes their sessions and bookings.

---

## 5. How auth works

I use **Better Auth**. It handles password hashing, sessions and cookies, so I don't write that security code myself.

**Server: `server/src/auth.js`**
```js
export const auth = betterAuth({
  database: pool,                          // same Postgres pool as my routes
  secret: process.env.BETTER_AUTH_SECRET,  // signs the cookie
  baseURL: process.env.BETTER_AUTH_URL,    // the site's public address
  trustedOrigins: [process.env.BETTER_AUTH_URL],
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
})
```
`index.js` hands every `/api/auth/*` request to Better Auth: `app.all('/api/auth/*splat', toNodeHandler(auth))`.
It's mounted **before** `express.json()` because Better Auth reads the request body itself.

**Sign up, step by step:**
1. `AuthDialog` calls `authClient.signUp.email({ name, email, password })`.
2. That sends `POST /api/auth/sign-up/email`.
3. Better Auth hashes the password and inserts a `user`, an `account` and a `session` row.
4. The response sets an **httpOnly cookie** with the session token. JavaScript can't read httpOnly cookies, so a malicious script can't steal it.
5. `useSession()` in `App.jsx` updates, and the header re-renders with "Sign out".

**Why the session survives a refresh:** the cookie stays in the browser. On load, `useSession()` calls
`GET /api/auth/get-session`, the browser sends the cookie, and Better Auth finds the matching `session` row.

**Protecting my own routes: `server/src/middleware/requireAuth.js`**
```js
const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
if (!session) return res.status(401).json({ error: 'Please sign in first.' })
req.user = session.user
next()
```
`router.post('/', requireAuth, handler)`: the handler only runs for signed-in users, and it uses `req.user.id`
(from the session, never from the request body) as the booking's owner.

**Sign out:** `authClient.signOut()` → `POST /api/auth/sign-out` deletes the session row and clears the cookie.

**Other sites can't log in on your behalf:** Better Auth checks the request's `Origin` header against
`trustedOrigins` and rejects anything else ("Invalid origin").

---

## 6. API routes

| Method + path | Login? | Returns |
|---|---|---|
| `GET /api/health` | no | `{ ok: true }` |
| `GET /api/dishes` | no | the whole menu, as an array of dish objects |
| `GET /api/tables` | no | the 9 dining tables |
| `GET /api/bookings/taken?date=2026-10-23&seating=7:00 pm` | no | `{ taken: ['T2', 'T6'] }` (ids only, no personal info) |
| `GET /api/bookings/mine` | **yes** | your upcoming bookings, with thali plates and total |
| `POST /api/bookings` | **yes** | creates a booking (+ thali items) → `201` with the booking |
| `DELETE /api/bookings/:id` | **yes** | cancels your own booking → `204` |
| `/api/auth/*` | – | Better Auth: `sign-up/email`, `sign-in/email`, `sign-out`, `get-session` |

Errors always come back as JSON `{ error: '…' }` with a proper status:
`400` bad input, `401` not signed in, `404` not found, `409` table already taken, `500` server error.

**Things worth pointing out in `routes/bookings.js`:**
- **Every value is checked again on the server** (date not in the past, seating exists, 1–6 guests, table big enough). The browser can't be trusted.
- **`$1, $2` placeholders**, never string-gluing, so SQL injection isn't possible.
- **A transaction** (`BEGIN` … `COMMIT` / `ROLLBACK`) saves the booking and its thali items together, or not at all.
- **Postgres error `23505`** (unique violation) becomes a friendly `409 "someone just booked that table"`.
- **`DELETE … WHERE id = $1 AND user_id = $2`**: you can only cancel your own bookings.

---

## 7. Running it locally

You need Node 22+ and a Neon database (see step 1 of §8).

```bash
# 1. Server
cd server
npm install
cp .env.example .env          # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run db:migrate            # create the tables
npm run db:seed               # load the menu + floor plan
npm run dev                   # API on http://localhost:3000 (restarts on save)

# 2. Client (second terminal)
cd client
npm install
npm run dev                   # site on http://localhost:5173
```

Open http://localhost:5173. Check the API on its own at http://localhost:3000/api/dishes.

Generate a secret with `openssl rand -base64 32`.

---

## 8. Deploying (Neon → Vercel)

### Step 1: Neon (database)
1. Sign up at neon.tech → **New project**.
2. **Connect** → copy the connection string (the *pooled* one, with `-pooler` in the host). Change `sslmode=require` to `sslmode=verify-full`.
3. Put it in `server/.env` as `DATABASE_URL`, then from `server/` run:
   ```bash
   npm run db:migrate && npm run db:seed
   ```
   In Neon's **Tables** view you should now see `dishes` with 14 rows.

### Step 2: Push to GitHub
```bash
git status            # make sure no .env file is listed!
git push
```

### Step 3: Vercel
1. vercel.com → **Add New… → Project** → import the repo. Leave **Root Directory** as the repo root:
   the root `vercel.json` tells Vercel to build `client/` (Vite) and `server/` (Express) as two services.
2. **Settings → Environment Variables** → add (for Production):
   - `DATABASE_URL`: the Neon string
   - `BETTER_AUTH_SECRET`: a new random string (`openssl rand -base64 32`)
   - `BETTER_AUTH_URL`: the production URL, e.g. `https://tamarind-and-tide.vercel.app` (no `/` at the end)
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the server picks the variables up.
4. Check `https://<your-site>/api/dishes` shows the menu as JSON, then open the site: sign up, refresh
   (still signed in), book a table and sign out.

**If something breaks:**
- Menu says "Couldn't load": open `/api/dishes` directly; if that fails, the server can't reach the database (check `DATABASE_URL`).
- Login says "Invalid origin": `BETTER_AUTH_URL` doesn't exactly match the URL in the browser (`https`, no trailing `/`). Vercel *preview* URLs (with random letters) won't work; use the production one.
- Anything else: Vercel → your project → **Logs**; server errors are printed there.

---

## 9. Likely assessment questions

**Walk me through your folder structure.**
Two apps in one repo. `client/` is the React site from Week 2, deployed to Vercel. `server/` is an Express API. Both deploy to
one Vercel project as two services (root `vercel.json`). Inside the server, `src/index.js` builds the app and plugs in `auth.js` and the three route files;
`db.js` is the database connection; `db/` holds the schema and seed scripts I run by hand.

**How is your database connected?**
`server/src/db.js` creates a `pg.Pool` from `process.env.DATABASE_URL`. Every route imports `pool` and calls
`pool.query(sql, values)`. Better Auth is given the same pool, so it uses the same Neon database.

**Where are your secrets, and how do you know they're not on GitHub?**
In `server/.env` locally and in Vercel's Environment Variables when live. The root `.gitignore` has `.env` and `.env.*`.
`git check-ignore -v server/.env` shows the rule that ignores it, and `git log --all -- server/.env` shows it was never committed.

**What does the seed script do?**
It loops over the Week 2 `dishes` and `tables` arrays and inserts each one. It uses `ON CONFLICT (id) DO UPDATE`,
so running it twice updates rows instead of duplicating them.

**How does React get the data now?**
`App.jsx` has a `useEffect` with `[]` that calls `getDishes()` once after the first render, then stores the result
with `setDishes`. Before that, `menuStatus` is `'loading'`, so the menu shows "Loading the menu…".

**How do you know who's signed in?**
`authClient.useSession()` in `App.jsx`. It asks `/api/auth/get-session`, and the browser sends the session cookie automatically.
`user` is passed to `Header` and `Reserve` as a prop.

**What stops someone booking as another user?**
The server never reads a user id from the request. `requireAuth` gets the user from the session cookie, and the
INSERT uses `req.user.id`.

**What happens if two people book the same table at the same moment?**
The `UNIQUE (table_id, booking_date, seating)` constraint lets only one INSERT succeed. The other gets Postgres
error `23505`, which I turn into a `409` and show as "Sorry, someone just booked that table".

**Why is `express.json()` after the auth handler?**
Better Auth reads the raw request body itself. If `express.json()` ran first, it would already have read it.

**What's a transaction and why use one?**
A group of queries that all succeed or all fail. A booking with a thali is one `bookings` row plus several
`booking_items` rows; if an item failed I don't want half a booking saved, so I `ROLLBACK`.

**What's the difference between 401 and 400?**
401 = you're not signed in. 400 = you are, but what you sent is invalid.
