# Presentation script: Tamarind & Tide

About 10 minutes, presented live from VS Code.

Each step tells you which file to **open**, what to **point at**, and what to **say**. The "say" lines are
written to be spoken. Use your own words if you like, but keep the order.

---

## Before you start (2 minutes of setup)

- **Make the code readable from the back of the room:** in VS Code press `Cmd +` three or four times.
- **Close every tab,** and collapse the sidebar so only the top-level folders show.
- **Open two browser tabs in advance:**
  1. the live site: https://tamarind-resturant.vercel.app
  2. the Neon dashboard → **Tables**
- **Sign out of the live site,** so you can show signing in.
- **Hide `server/.env`.** Never open it on screen, because it holds your real password and secret.

---

## Part 1: What I built (1 minute)

**Show:** the live site.

> "This is Tamarind & Tide, a restaurant website. In Week 2 it was just a React site with all the data written
> into the code. This week I gave it a real backend: a database, an API, real login, and it's all live on the internet.
>
> It has three parts: a React frontend, an Express backend, and a Postgres database on Neon. Both the frontend
> and the backend are hosted together on Vercel."

---

## Part 2: The folder structure (1 minute)

**Show:** the VS Code sidebar, with the top level only.

**Point at:** `client/`, then `server/`, then `vercel.json`.

> "The project is split into two folders.
>
> `client` is the frontend, the React site you just saw.
>
> `server` is the backend, an Express API that talks to the database.
>
> And `vercel.json` at the top tells Vercel how to host both of them from one repository."

**Expand `server/`** and point at `db/` and `src/`:

> "Inside the server there are two folders. `src` is the app that is always running. `db` holds scripts I run
> once by hand, to create the tables and fill them with data."

---

## Part 3: The database (2 minutes)

### Open `server/db/schema.sql`

**Point at:** the four auth tables at the top.

> "This file creates every table in the database. The first four (`user`, `session`, `account` and `verification`)
> belong to my login library, Better Auth. `user` is a person, `session` is a signed-in browser, and `account`
> stores the password, but only as a hash, never the real password."

**Scroll to:** `dishes`, `dining_tables`, `bookings`, `booking_items`.

> "These four are my own tables. `dishes` is the menu, `dining_tables` is the nine tables in the restaurant,
> `bookings` is a reservation, and `booking_items` is the food someone pre-ordered with their booking."

**Point at:** `UNIQUE (table_id, booking_date, seating)`.

> "This line is important. It means the database itself will never allow two bookings for the same table at the
> same time, even if two people click at exactly the same moment."

**Point at:** any `REFERENCES … ON DELETE CASCADE`.

> "`REFERENCES` links tables together, so a booking must belong to a real user and a real table. `CASCADE`
> means if a booking is deleted, its food items are deleted with it."

### Open `server/db/seed-data.js`, then `seed.js`

> "In Week 2 my menu was an array in the React code. I moved that array here. The seed script loops over it and
> inserts each dish into the database. It uses `ON CONFLICT DO UPDATE`, so running it twice updates the rows
> instead of creating duplicates."

**Switch to the Neon tab** and open the `dishes` table:

> "And here are the 14 dishes, now in a real Postgres database."

---

## Part 4: The backend (3 minutes)

### Open `server/src/db.js`

> "This is the database connection. It reads the database address from an environment variable, which is a secret
> kept in a `.env` file that is never uploaded to GitHub. A *pool* keeps a few connections open so every request
> doesn't have to reconnect."

### Open `server/src/index.js`

> "This is the heart of the backend: it builds the Express app. Reading from top to bottom:
>
> First, anything starting with `/api/auth` goes to Better Auth, which handles sign up, sign in and sign out.
>
> Then `express.json()` reads the data the browser sends.
>
> Then my own routes: dishes, tables and bookings.
>
> At the bottom: a 404 for unknown addresses, and an error handler, so if anything breaks the user gets a
> safe message and the real error is only logged on the server."

### Open `server/src/auth.js`

> "This sets up login. I give Better Auth my database, a secret used to sign the login cookie, and my website's
> address so it rejects logins coming from any other site. Users stay signed in for seven days."

### Open `server/src/middleware/requireAuth.js`

> "This is a guard. I put it in front of any route that needs you to be signed in. It reads your login cookie,
> asks Better Auth who you are, and if you're not signed in it stops the request with a 401 error."

### Open `server/src/routes/dishes.js`

> "This is the simplest route. When the browser asks for `/api/dishes`, it runs one SQL query and sends the
> rows back as JSON."

### Open `server/src/routes/bookings.js`

> "This is the main feature. It has four routes: see which tables are taken, see my bookings, make a booking,
> and cancel a booking."

**Scroll to `router.post`:**

> "When someone books, three things happen.
>
> One: I check everything again on the server (the date, the seating, the number of guests, the table size),
> because anyone could send a request without using my form.
>
> Two: the user comes from their login session, not from the request, so nobody can book as someone else.
>
> Three: the booking and the food are saved in a *transaction*: either everything is saved, or nothing is."

**Point at:** `err.code === '23505'`.

> "If the table was just taken, the database rejects it with error 23505 (that's the UNIQUE rule I showed
> earlier) and I turn that into a friendly message."

**Point at:** `DELETE … AND user_id = $2`.

> "And for cancelling, `AND user_id` means you can only ever cancel your own bookings."

---

## Part 5: The frontend (2 minutes)

**Expand `client/src/`.**

> "The frontend is the same React site from Week 2. I only changed the parts that now talk to the backend."

### Open `client/src/lib/api.js`

> "Every request to my API goes through this one file. Each route has a small function, like `getDishes` or
> `createBooking`. If the server sends an error, this turns it into a message I can show on the page."

### Open `client/src/App.jsx`

**Point at:** the `useEffect` with `getDishes()`.

> "Before, the menu was imported from a file. Now, when the page first loads, this `useEffect` fetches it from the
> API and saves it in state. While it's loading, the menu shows 'Loading…'."

**Point at:** `authClient.useSession()`.

> "This line knows who is signed in. It asks the server using the login cookie, which is why you stay signed
> in after refreshing the page."

### Open `client/src/components/AuthDialog.jsx`

> "This is the sign-in popup. It has two modes, sign in and create account, and it shows errors like
> 'Invalid email or password'."

### Open `client/src/components/Reserve.jsx`

> "This is the booking section. It loads the tables from the database, and every time you change the date or
> seating, it asks the server which tables are already taken. When you book, it sends everything to the API, and
> your bookings appear below with a Cancel button."

---

## Part 6: Live demo (2 minutes)

On the live site:

1. **Click "Book a table" while signed out.**
   > "You can't book without signing in."
2. **Create an account.**
   > "The header now says 'Hi' and 'Sign out'."
3. **Refresh the page.**
   > "Still signed in. That's the session cookie."
4. **Add a dish, pick a table, book.**
   > "Booked."

   Then switch to **Neon** → `bookings`:
   > "And here's the row in the database."
5. **Cancel the booking.**
   > "Gone from the page and from the database."
6. **Sign out.**

---

## Part 7: Secrets and deployment (1 minute)

### Open `.gitignore`

> "My secrets (the database password and the login secret) are in `server/.env`. This line in `.gitignore`
> means it is never uploaded to GitHub. On Vercel I typed them into the Environment Variables settings instead."

### Open `vercel.json`

> "This tells Vercel to host two services from one repo: the React site and the Express server. Anything starting
> with `/api` goes to the server, everything else goes to the React site. Because both are on the same address,
> the login cookie works properly in every browser."

**Close with:**
> "So in summary: a React frontend, an Express API, a Postgres database, real login with sessions, all live on
> Vercel. Thank you, happy to take questions."

---

## Tips for presenting to 10 people

- **One file at a time.** Close each file before opening the next so the screen stays clean.
- **Point, then talk.** Highlight the line with your mouse *before* you explain it, so everyone looks at the same thing.
- **Don't read code word by word.** Say what it *does* ("this checks you're signed in"), not what it says.
- **Keep the demo short.** If something fails live, stay calm, refresh, and if needed say "I'll show it locally". Have `npm run dev` ready in two terminals as a backup.
- **For questions you don't know,** say "good question, let me show you where that happens" and open the file. Most answers are in [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md), section 11.
- **Rehearse once with a timer.** Aim for 10 minutes and cut Part 5 short if you're over.

### Cheat sheet: one sentence per file

| File | One sentence |
|---|---|
| `vercel.json` | Hosts the React site and the Express server together; `/api` goes to the server. |
| `server/db/schema.sql` | Creates all 8 tables and the rules that keep the data correct. |
| `server/db/seed.js` | Moves my Week 2 menu and tables into the database. |
| `server/src/db.js` | Connects to the Neon database. |
| `server/src/index.js` | Builds the Express app and plugs in login and all the routes. |
| `server/src/auth.js` | Sets up Better Auth for sign up, sign in and sessions. |
| `server/src/middleware/requireAuth.js` | Blocks a route unless you're signed in. |
| `server/src/routes/dishes.js` | Sends the menu as JSON. |
| `server/src/routes/bookings.js` | Checks, saves and cancels bookings safely. |
| `client/src/lib/api.js` | Every call from React to my API, in one place. |
| `client/src/App.jsx` | Loads the menu and knows who is signed in. |
| `client/src/components/AuthDialog.jsx` | The sign-in / create-account popup. |
| `client/src/components/Reserve.jsx` | The booking section, connected to the real API. |
| `.gitignore` | Keeps my secrets out of GitHub. |
