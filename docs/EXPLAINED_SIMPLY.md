# Tamarind & Tide, explained simply

A plain-English guide to the whole project, for presenting to people who may not be programmers.
Every technical word is explained the first time it appears.

---

## 1. What the website does

Tamarind & Tide is a website for a restaurant. A visitor can:

1. **Look at the menu** (14 dishes, filtered by lunch/dinner, veg, course).
2. **Create an account and sign in.**
3. **Stay signed in** even after closing or refreshing the page.
4. **Book a table** on a floor plan of the restaurant, and pre-order a thali (food) with it.
5. **See their upcoming bookings** and **cancel** them.

---

## 2. The big idea: the restaurant analogy

The easiest way to explain the code is to compare it to a real restaurant.

| Real restaurant | Our project | What it is |
|---|---|---|
| **The dining room and printed menu**: what customers see | **Frontend** (the `client/` folder) | The website in your browser, built with React |
| **The waiter**: takes your order to the kitchen, brings back food | **Backend** (the `server/` folder) | A program called Express that receives requests and sends answers |
| **The store room and order book**: where everything is written down and kept | **Database** (Postgres, hosted on Neon) | Where all data is saved permanently |
| **The waiter's list of things you can ask for** | **API** | The fixed list of "requests" the frontend is allowed to make |
| **The doorman who checks your membership card** | **Better Auth + `requireAuth`** | Login system and the check that you are signed in |
| **The building the restaurant is in** | **Vercel** | The company that puts our website on the internet |

**The rule:** the customer (browser) never walks into the store room (database).
They always ask the waiter (backend), and the waiter decides what is allowed.

```
   You, in the browser            The waiter               The store room
  ┌──────────────────┐         ┌──────────────┐         ┌──────────────────┐
  │  FRONTEND        │ request │  BACKEND     │   SQL   │  DATABASE        │
  │  React website   │ ──────► │  Express API │ ──────► │  Postgres (Neon) │
  │  (client/)       │ ◄────── │  (server/)   │ ◄────── │  8 tables        │
  └──────────────────┘ answer  └──────────────┘  rows   └──────────────────┘
                       (JSON)
```

**JSON** is just the format the answer comes back in. It looks like this:
`{ "name": "Prawn Sukka", "price": 460 }`. It's text that both sides understand.

---

## 3. The tools we used (and why)

| Tool | In one sentence |
|---|---|
| **React** | Builds the website out of reusable pieces (Header, Menu, Booking section…). |
| **Vite** | Runs the website on our laptop while we develop, and packages it for the internet. |
| **Tailwind** | Makes styling quick (colours, spacing) by writing short class names. |
| **Node.js** | Lets us run JavaScript on a server, not just in a browser. |
| **Express** | A small Node.js library for building the backend: "when someone asks for X, do Y". |
| **Postgres** | A database: data is stored in tables, like Excel sheets with strict rules. |
| **Neon** | A company that hosts our Postgres database in the cloud, so we don't run it ourselves. |
| **pg** | The library that lets our Express code talk to Postgres. |
| **Better Auth** | A ready-made login system: sign up, sign in, sign out, password safety. |
| **Vercel** | Hosts both the website and the backend on the internet, at one address. |

The backend only needs **3 packages**: `express`, `pg`, and `better-auth`.

---

## 4. Folder structure

```
tamarind-and-tide/
├─ client/                  ← FRONTEND (what you see)
│  └─ src/
│     ├─ App.jsx            the top of the website, loads the menu, knows who is signed in
│     ├─ components/        the pieces of the page: Header, Menu, Reserve, AuthDialog…
│     └─ lib/api.js         the ONE file that talks to the backend
│
├─ server/                  ← BACKEND (the waiter)
│  ├─ src/                  the program that is always running
│  │  ├─ index.js           the main file: sets everything up
│  │  ├─ db.js              connects to the database
│  │  ├─ auth.js            sets up login
│  │  ├─ middleware/
│  │  │  └─ requireAuth.js  the "are you signed in?" check
│  │  └─ routes/            the actual APIs: dishes.js, tables.js, bookings.js
│  │
│  └─ db/                   scripts we run ONCE to set up the database
│     ├─ schema.sql         creates all the tables
│     ├─ migrate.js         runs schema.sql
│     ├─ seed-data.js       the menu and table list
│     └─ seed.js            puts that data into the database
│
└─ vercel.json              tells Vercel how to put it all online
```

---

## 5. The database

### 5.1 What a database table is

Think of each table as **an Excel sheet**. Each **row** is one thing (one dish, one booking).
Each **column** is one piece of information about it (name, price…). Unlike Excel, the database
**enforces rules**: it refuses data that breaks them.

### 5.2 Our 8 tables

We have **8 tables** in two groups.

**Group 1: login tables (4).** Better Auth creates and uses these. Our own code doesn't touch them.

| Table | One row means… | Example |
|---|---|---|
| `user` | one person who signed up | Asha, asha@mail.com |
| `session` | one browser where someone is signed in | "Asha is signed in on her laptop until next Friday" |
| `account` | how that person logs in | email + **scrambled** password |
| `verification` | short-lived codes (like password reset) | required by Better Auth |

> **Important:** the password is never stored as-is. It's turned into a **hash**, a scrambled
> version that can't be turned back into the real password. Even we can't see users' passwords.

**Group 2: restaurant tables (4).** These are ours.

| Table | One row means… | Example |
|---|---|---|
| `dishes` | one dish on the menu | Prawn Sukka, ₹460, non-veg, spice 2 |
| `dining_tables` | one table in the restaurant (there are 9) | T5, 6 seats, Courtyard |
| `bookings` | one reservation | Asha, table T5, 25 Oct, 7:00 pm, 4 guests |
| `booking_items` | one dish pre-ordered with a booking | booking #12 → 2 × Prawn Sukka |

### 5.3 How the tables connect

```
 user ───< bookings >─── dining_tables
               │
               └───< booking_items >─── dishes
```

Read `───<` as **"one … has many …"**:
- One **user** has many **bookings**.
- One **dining table** has many **bookings** (on different days and times).
- One **booking** has many **booking items** (the thali dishes).
- Each **booking item** points to one **dish**.

`booking_items` is called a **join table**: it connects bookings and dishes,
and adds how many plates (`qty`).

### 5.4 The rules the database enforces

These are written in [schema.sql](../server/db/schema.sql). Even if our code had a bug, the database would still say no.

| Rule | What it means in plain English |
|---|---|
| `NOT NULL` | "This box can't be empty." A booking must have a name and phone. |
| `CHECK (spice BETWEEN 0 AND 3)` | "Spice level must be 0, 1, 2 or 3." No spice level 7. |
| `CHECK (guests BETWEEN 1 AND 6)` | "A booking is for 1 to 6 people." |
| `UNIQUE (email)` | "Two accounts can't use the same email." |
| `REFERENCES` (foreign key) | "This must point to something real." A booking must belong to a real user and a real table. |
| `ON DELETE CASCADE` | "Delete the parent, delete the children." Cancel a booking and its thali items disappear too. |
| `UNIQUE (table_id, booking_date, seating)` | **"One table can only be booked once per day per time slot."** No double bookings, even if two people click at the same second. |

### 5.5 How the database was set up

We run two commands once:

```bash
npm run db:migrate   # creates the 8 empty tables (runs schema.sql)
npm run db:seed      # fills in the 14 dishes and 9 dining tables
```

- In Week 2, the menu was typed directly into the React code. `seed.js` **moved it into the database**.
- Both commands are safe to run again. `IF NOT EXISTS` means "only create it if it isn't there yet",
  and `ON CONFLICT … DO UPDATE` means "if this dish already exists, update it instead of adding a copy".

### 5.6 How the backend talks to the database

[db.js](../server/src/db.js) creates a **pool**:

```js
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
```

- `DATABASE_URL` is the database's address plus its password. It's a **secret**, kept in a `.env` file that is never uploaded to GitHub.
- A **pool** is like having a few phone lines to the database already open. Each request borrows one, uses it, and gives it back. Faster than dialling from scratch every time.

Every query looks like this:

```js
pool.query('SELECT * FROM bookings WHERE id = $1', [id])
```

The `$1` is a **placeholder**. The value is sent separately from the command, so a user can't sneak
their own database commands in by typing them into a form. That attack is called **SQL injection**, and placeholders stop it.

---

## 6. How the backend works

### 6.1 The main file: [index.js](../server/src/index.js)

Think of it as the waiter's instruction sheet, read **from top to bottom** for every request:

```
A request arrives
   │
   ├─ 1. Does it start with /api/auth/ ?  → hand it to Better Auth (login stuff)
   │
   ├─ 2. Unpack the data the browser sent (express.json)
   │
   ├─ 3. Is it one of our routes?
   │        /api/health    → health check
   │        /api/dishes    → dishes.js
   │        /api/tables    → tables.js
   │        /api/bookings  → bookings.js
   │
   ├─ 4. None of the above?  → "404 Not found"
   │
   └─ 5. Did anything crash? → log the real error privately,
                               send the user "Something went wrong on the server."
```

Step 5 matters: users never see our internal error details, which could help an attacker.

### 6.2 What an API request looks like

Every request has:
- a **method**, which says what kind of action it is:
  - `GET`: "give me something" (read)
  - `POST`: "here's something new, save it" (create)
  - `DELETE`: "remove this" (delete)
- a **path**, which says what it's about, like `/api/dishes`
- sometimes a **body**, the data being sent (like the booking form details)

Every answer has a **status code**, a number that says how it went:

| Code | Meaning | When we use it |
|---|---|---|
| `200` | OK | Normal successful answer |
| `201` | Created | A booking was saved |
| `204` | Done, nothing to send back | A booking was cancelled |
| `400` | Your request is wrong | e.g. a date in the past, 10 guests |
| `401` | You're not signed in | Trying to book while signed out |
| `404` | Not found | That booking doesn't exist, or isn't yours |
| `409` | Conflict | Someone else just booked that table |
| `500` | Server error | Something broke on our side |

### 6.3 The "are you signed in?" check: [requireAuth.js](../server/src/middleware/requireAuth.js)

This is a **middleware**: a check that runs *before* the real code. Like a doorman.

```
Request arrives  →  requireAuth: "show me your login cookie"
                       │
                       ├─ no valid cookie  →  stop: 401 "Please sign in first."
                       │
                       └─ valid cookie     →  "this is Asha" (req.user)  →  continue to the route
```

We put it in front of every API that needs a signed-in user.

---

## 7. All the APIs: how many and how each one works

### 7.1 The count

**Our own APIs: 8**

| # | Method + path | Sign-in needed? | What it does | Used by the website? |
|---|---|---|---|---|
| 1 | `GET /` | No | Lists our API routes (an info page) | No, it's for developers |
| 2 | `GET /api/health` | No | Checks the server and database are working | No, it's for developers |
| 3 | `GET /api/dishes` | No | Gives the full menu | Yes |
| 4 | `GET /api/tables` | No | Gives the 9 tables for the floor plan | Yes |
| 5 | `GET /api/bookings/taken` | No | Which tables are already booked for a date + time | Yes |
| 6 | `GET /api/bookings/mine` | **Yes** | My upcoming bookings | Yes |
| 7 | `POST /api/bookings` | **Yes** | Make a booking | Yes |
| 8 | `DELETE /api/bookings/:id` | **Yes** | Cancel one of my bookings | Yes |

**Login APIs from Better Auth: 4 that we use**

| # | Method + path | What it does |
|---|---|---|
| 9 | `POST /api/auth/sign-up/email` | Create an account |
| 10 | `POST /api/auth/sign-in/email` | Sign in |
| 11 | `POST /api/auth/sign-out` | Sign out |
| 12 | `GET /api/auth/get-session` | "Who is signed in right now?" |

> **Short answer if asked "how many APIs?"**
> "**8 that I wrote myself**, 6 of which the website uses, plus **4 login APIs** that Better Auth
> provides. So the website uses **10 APIs** in total."

On the frontend, every one of our own APIs has a small function in [api.js](../client/src/lib/api.js)
(`getDishes`, `getTables`, `getTakenTables`, `getMyBookings`, `createBooking`, `cancelBooking`).
The page components call those functions and never talk to the server directly.

---

### 7.2 Each API, step by step

#### API 1: `GET /` (info page)
- **What happens:** sends back the project name and a list of routes.
- **Why:** so anyone opening the backend address sees something useful instead of an error.

#### API 2: `GET /api/health` (health check)
- **What happens:**
  1. Checks whether the three settings (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) are present.
  2. Asks the database whether the `dishes` and `user` tables exist.
- **Answer:** `200` with `"ok": true` if everything works, otherwise `500` with what's missing.
- **Why:** when the live site breaks, one click tells you whether the database or a setting is the problem.
  It shows only true/false for secrets, never their actual values.

#### API 3: `GET /api/dishes` (the menu). File: [dishes.js](../server/src/routes/dishes.js)
- **Who calls it:** [App.jsx](../client/src/App.jsx), once when the page first opens.
- **What happens:** one database query, `SELECT … FROM dishes ORDER BY id`.
- **Answer:** a list of 14 dishes, e.g. `[{ "id": 1, "name": "Rava-fried Ladyfish", "price": 420, … }, …]`
- **Nice detail:** the database column is `chefs_pick`, but React expects `chefsPick`.
  The query renames it (`chefs_pick AS "chefsPick"`), so the React code from Week 2 didn't need to change.
- **While waiting:** the menu shows "Loading the menu…". If it fails, it shows an error message.

#### API 4: `GET /api/tables` (the floor plan). File: [tables.js](../server/src/routes/tables.js)
- **Who calls it:** the booking section ([Reserve.jsx](../client/src/components/Reserve.jsx)), once.
- **What happens:** `SELECT id, seats, zone, x, y FROM dining_tables`.
- **Answer:** the 9 tables, e.g. `{ "id": "T5", "seats": 6, "zone": "Courtyard", "x": 20, "y": 50 }`.
  `x` and `y` say where to draw the table on the floor plan (as a percentage of the width and height).

#### API 5: `GET /api/bookings/taken?date=…&seating=…` (which tables are taken)
- **Who calls it:** the booking section, **every time you change the date or the time slot**.
- **What you send:** the date and time in the address, e.g. `?date=2026-10-25&seating=7:00 pm`
- **What happens:**
  1. Checks the date is real and the time slot is one we offer. If not → `400`.
  2. Asks the database: "which table ids have a booking on this date at this time?"
- **Answer:** `{ "taken": ["T3", "T5"] }`. Those tables are greyed out on the map.
- **Privacy:** it returns **only the table ids**, never who booked them. That's why it's safe without sign-in.

#### API 6: `GET /api/bookings/mine` (my bookings). 🔒 Sign-in needed
- **Who calls it:** the booking section, when you sign in and after every booking or cancel.
- **What happens:**
  1. `requireAuth` checks your cookie and works out who you are.
  2. The database finds **your** bookings from today onwards.
  3. For each booking it also adds up the thali: how many plates, and the total price.
- **Answer:** `[{ "id": 12, "tableId": "T5", "date": "2026-10-25", "seating": "7:00 pm", "guests": 4, "plates": 3, "total": 1180 }]`
- **Note:** it uses a `LEFT JOIN`, which means "include bookings even if they have no food pre-ordered".

#### API 7: `POST /api/bookings` (make a booking). 🔒 Sign-in needed
This is the most important API. It happens in **4 steps**:

**Step 1: Are you signed in?** `requireAuth` checks. If not → `401`.

**Step 2: Check everything again.** The browser form already checks things, but anyone can send
a request without using our form, so the server checks it all again:

| Check | If it fails |
|---|---|
| Name and phone are filled in | `400` "Name and phone are required." |
| The date is real and not in the past | `400` "Pick a date from today onwards." |
| The time slot is one we offer | `400` "That seating is not available." |
| Guests is between 1 and 6 | `400` "Guests must be between 1 and 6." |
| The food list is valid | `400` "The thali pre-order is not valid." |
| The table exists | `400` "That table does not exist." |
| The table has enough seats | `400` "That table is too small for your party." |

**Step 3: Save it, all or nothing.** The booking and its food items are saved inside a **transaction**:

```
BEGIN       ← "start a group of changes"
  save the booking               (1 row in bookings)
  save each dish in the thali    (1 row per dish in booking_items)
COMMIT      ← "keep all of it"

If anything goes wrong in the middle: ROLLBACK ← "undo all of it"
```

Think of it like a bank transfer: money must leave one account **and** arrive in the other.
You never want half of it. We never end up with a booking whose food is missing.

**Step 4: Turn database errors into friendly messages.**
- Someone else booked that table a moment ago? The `UNIQUE` rule rejects it (Postgres error `23505`)
  → we send `409` "Sorry, someone just booked that table. Pick another."
- A dish that no longer exists? (error `23503`) → `400` "One of those dishes is no longer on the menu."

**Answer on success:** `201` with the new booking. The page shows a "Booked" stamp.

> **Security point:** the booking's owner is taken from **the login session**, never from the form.
> So nobody can make a booking pretending to be someone else.

#### API 8: `DELETE /api/bookings/:id` (cancel). 🔒 Sign-in needed
- **Who calls it:** the "Cancel" button next to a booking.
- **What you send:** the booking number in the address, e.g. `DELETE /api/bookings/12`
- **What happens:** `DELETE FROM bookings WHERE id = 12 AND user_id = <you>`
- **The key part is `AND user_id = <you>`:** you can only delete **your own** booking. If you guess
  someone else's booking number, nothing is deleted and you get `404`.
- Thanks to `ON DELETE CASCADE`, the booking's food items are deleted automatically.
- **Answer:** `204` (done, nothing to send back).

#### APIs 9–12: Login, handled by Better Auth. Setup in [auth.js](../server/src/auth.js)
We didn't write these ourselves. We configured Better Auth and it provides them. That's safer than
writing our own password code.

**Creating an account (API 9)**
1. You fill in name, email and password in the popup ([AuthDialog.jsx](../client/src/components/AuthDialog.jsx)).
2. Better Auth checks the password is at least 8 characters, scrambles (hashes) it, and saves a row
   in `user`, `account` and `session`.
3. It sends back a **cookie**: a small ticket the browser stores and automatically shows on every
   later request. Like a wristband at an event.
4. The header changes to "Hi, Asha · Sign out".

**Signing in (API 10):** same idea. Better Auth checks the password against the hash, creates a
new `session` row, and gives you a new cookie.

**Staying signed in after refresh (API 12):** when the page loads, it asks `get-session`. The browser
shows its cookie, Better Auth finds the matching `session` row, and says "this is Asha".
Sessions last **7 days**.

**Signing out (API 11):** deletes the `session` row and removes the cookie.

**Why the cookie is safe:**
- It's **httpOnly**, meaning JavaScript on the page can't read it, so a malicious script can't steal it.
- It's signed with `BETTER_AUTH_SECRET`, so it can't be faked.
- `trustedOrigins` means only our own website can log people in. Other websites are rejected.

---

## 8. One full journey, start to finish

**"Asha books table T5 for Saturday dinner with a thali."**

```
 1. Asha opens the site
      → GET /api/dishes            menu appears
      → GET /api/auth/get-session  "not signed in"
      → GET /api/tables            floor plan appears

 2. She picks Saturday, 7:00 pm
      → GET /api/bookings/taken    T3 is greyed out

 3. She clicks "Book", isn't signed in, so the popup opens. She creates an account.
      → POST /api/auth/sign-up/email   user + account + session rows created, cookie set
      → GET  /api/bookings/mine         empty list

 4. She adds 2 dishes, picks T5, clicks "Request table"
      → POST /api/bookings
           requireAuth: "this is Asha" ✓
           all checks pass ✓
           BEGIN → 1 booking row + 2 booking_items rows → COMMIT
           201 Created → "Booked" stamp

      → GET /api/bookings/taken    T5 now shows as taken
      → GET /api/bookings/mine     her booking appears in the list

 5. She clicks "Cancel"
      → DELETE /api/bookings/12    row deleted (items go too) → 204
```

---

## 9. Secrets: keeping passwords safe

| Secret | What it is |
|---|---|
| `DATABASE_URL` | The database address **and password** |
| `BETTER_AUTH_SECRET` | A long random string used to sign login cookies |
| `BETTER_AUTH_URL` | The website's address (not secret, but needed) |

- On our laptop they live in `server/.env`. The `.gitignore` file says "never upload `.env` to GitHub".
- On the live site they're typed into Vercel's **Environment Variables** settings.
- `server/.env.example` *is* on GitHub. It lists the names only, no values, so others know what to fill in.
- **No secrets are in the frontend.** Anything in the website's code can be seen by every visitor.

---

## 10. How it runs: on a laptop and live

### On the laptop (two terminals)

```bash
cd server && npm run dev    # backend  → http://localhost:3000
cd client && npm run dev    # website  → http://localhost:5173
```

The website runs on port 5173 and the backend on 3000. [vite.config.js](../client/vite.config.js) has a
**proxy**: any request starting with `/api` is quietly forwarded from 5173 to 3000.
So the browser thinks it's all one website.

### Live on the internet

[vercel.json](../vercel.json) tells Vercel:
- build **two services** from this one repository: `client` (React) and `server` (Express)
- any address starting with `/api/` → send it to the server
- everything else → send it to the React website

### Why "one address" matters

The login cookie only works smoothly if the website and the backend share the **same address**.
If they were on two different addresses, browsers would treat the cookie as "third-party" and block it,
and nobody could stay signed in. The proxy (on the laptop) and the rewrite rules (on Vercel) solve this.

---

## 11. Likely questions, with simple answers

**What's the difference between frontend and backend?**
Frontend is what you see and click (React, in the browser). Backend is the program on the server
that saves and loads data and decides what's allowed (Express).

**Why not let the website talk to the database directly?**
Then the database password would be in the website code, visible to everyone. The backend keeps the
password hidden and checks every request.

**What is an API?**
A fixed list of requests the frontend can make to the backend, like a waiter's list of things you can order.

**How many APIs are there?**
8 written by me (6 used by the site, plus a health check and an info page), and 4 login APIs from Better Auth.

**How do you stop double bookings?**
The database rule `UNIQUE (table_id, booking_date, seating)`. Even if two people click at the exact
same moment, only one is saved. The other gets "someone just booked that table".

**How do you stop someone cancelling my booking?**
The delete query includes `AND user_id = <the signed-in user>`, so it only ever touches your own bookings.

**How do you stop someone booking as another person?**
The user comes from the login cookie, not from anything the form sends.

**Where are passwords stored?**
In the `account` table, but only as a hash (scrambled). The real password is never saved.

**Why check the form on the server if the browser already checks it?**
Anyone can send a request without using our website. The server is the only part we fully control.

**What's a transaction?**
A group of database changes that either all happen or none happen. A booking and its food are saved together.

**What's SQL injection and how do you stop it?**
Typing database commands into a form to trick the server. We use `$1, $2` placeholders, so whatever
a user types is treated as plain data, never as a command.

**What happens if the server crashes on a request?**
The error handler logs the real error privately and sends the user a safe message with a `500` code.

---

## 12. One-line summary to close with

> "It's a React website that talks to an Express backend through 8 APIs of my own plus 4 login APIs.
> The backend stores everything in a Postgres database with 8 tables, uses Better Auth for safe login
> with cookies, protects bookings so only you can see and cancel yours, and the whole thing runs live on Vercel."
