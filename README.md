# Tamarind & Tide

A coastal restaurant site built with Next.js App Router, React, Tailwind CSS, Better Auth and PostgreSQL (Neon). The frontend and API now run as one JavaScript application.

## Run locally

Use Node.js 22 or later. From the repository root:

```bash
npm install
cp .env.example .env.local
# Fill in DATABASE_URL and BETTER_AUTH_SECRET in .env.local.
# Set BETTER_AUTH_URL=http://localhost:3000.
npm run dev
```

Open http://localhost:3000. Development and production builds use the supported Webpack option because Turbopack worker ports are restricted in this environment. The migration copies the existing local server environment into `.env.local` when that file does not already exist. The previous `server/.env` is no longer used. Both are git-ignored.

Existing users, dishes and bookings remain in the same database. Apply schema updates, including the payment tables, with:

```bash
npm run db:migrate
```

For a new database, also run `npm run db:seed` to add the menu and dining tables.

Database scripts use Next.js environment loading, including `.env.local`. Seeding updates the menu and table rows, so there is no need to rerun it for the framework migration.

## Structure

```text
src/
  app/
    layout.jsx                 HTML shell, metadata and fonts
    page.jsx                   Home page
    globals.css                Tailwind and existing restaurant styles
    api/
      auth/[...all]/route.js    Better Auth GET/POST handler
      dishes/route.js           Menu
      tables/route.js           Floor plan
      bookings/route.js         Create reservation
      bookings/taken/route.js   Table availability
      bookings/mine/route.js    Your upcoming reservations
      bookings/[id]/route.js    Cancel your reservation
      health/route.js           Database/configuration check
      [...path]/route.js        JSON API 404
  App.jsx                      Interactive client component
  components/                  Existing restaurant components
  data/                        Static labels and service times
  lib/                         Browser API and auth clients
  server/                      Database pool, auth and route helpers
  utils.js                     Thali and formatting helpers
db/                            SQL schema, seed data and migration scripts
tests/                         Boundary tests and read-only HTTP smoke checks
```

`App.jsx` starts the client component tree so React hooks and browser events continue to work. `layout.jsx` and `page.jsx` are server components. API routes use native `Request` and `Response` objects in the Node.js runtime, replacing Express routers. There is no Vite proxy or separate API process.

## Authentication and bookings

Better Auth still manages the same `user`, `session`, `account` and `verification` tables. Requests go to `/api/auth/*` using same-origin cookies. Protected routes call `requireAuth(request)` to validate the real session and obtain the user ID. A browser-supplied user ID is never trusted.

Reservations still validate table capacity, date, seating and quantities on the server. Booking and dish inserts share a database transaction. The unique database constraint prevents duplicate reservations for a table/date/seating. Cancellation and personal booking queries are restricted to the session owner. The development database pool is reused across hot reloads.

## API

| Method | URL | Login required |
| --- | --- | --- |
| GET | `/api/health` | No |
| GET | `/api/dishes` | No |
| GET | `/api/tables` | No |
| GET | `/api/bookings/taken?date=2026-10-25&seating=7%3A00%20pm` | No |
| GET | `/api/bookings/mine` | Yes |
| POST | `/api/bookings` | Yes |
| DELETE | `/api/bookings/:id` | Yes |
| GET / POST | `/api/auth/*` | Managed by Better Auth |

The existing frontend payloads and JSON responses are preserved. Errors use `{ error: '...' }` with HTTP 400, 401, 404, 409 or 500.

## Checks

```bash
npm run lint
npm test
npm run build
npm start
# In another terminal, against the running app:
npm run test:smoke
```

The smoke script checks page rendering, database-backed menu/table reads, session handling, authorization, availability validation and JSON 404s without creating accounts or bookings. To check reservations manually: sign in with an existing account, refresh, book an available table, check your upcoming bookings, and cancel that reservation. Test thali payments separately using the Stripe steps below.

## Deploy on Vercel

Use the repository root as the Vercel Root Directory and **Next.js** as the framework preset. This is now one service; the old multi-service `vercel.json` configuration has been removed. If the existing Vercel project has saved service settings or build overrides, remove those and use the Next.js defaults (`npm run build`).

Set `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in Vercel environment variables. The auth URL must exactly match the public production origin (for example `https://your-site.vercel.app`). Keep these variables server-side; none need a `NEXT_PUBLIC_` prefix. Redeploy and check `/api/health`, login and booking behavior.

## Stripe Checkout (Assignment 4)

Thali payments and table reservations are separate. Pick dishes, click **Order this thali**, and sign in. The site's **Review & pay** page shows the saved dishes, quantities and total; **Continue to secure payment** opens Stripe's hosted test checkout. **Change your dishes** restores the owner's pending selection in the menu. Table reservations remain free and separate.

### Local setup

1. Create a Stripe account and select its test environment/sandbox. Copy the **test secret key** from its API keys page into `.env.local`:

   ```dotenv
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_WEBHOOK_SECRET=whsec_from_the_next_step
   BETTER_AUTH_URL=http://localhost:3000
   ```

   Never commit keys or paste them into source files. No publishable key is needed for this hosted Checkout redirect. The server rejects live keys and live payment events.

2. Apply the schema from the repository root:

   ```bash
   npm run db:migrate
   ```

3. The [official Stripe CLI](https://docs.stripe.com/stripe-cli) is included as a development dependency. Keep this running in a separate terminal:

   ```bash
   npm run stripe:listen
   ```

   The helper loads your test key from `.env.local`, passes it privately through `STRIPE_API_KEY`, and forwards the checkout and failed-payment events to the localhost origin in `BETTER_AUTH_URL`. It saves the listener's signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local` and redacts secrets from terminal output. No separate CLI login is needed. A CLI listener secret is different from a Dashboard endpoint secret. Restart the app after changing environment variables.

   To manage the CLI yourself instead, run `npx stripe login`, then `npx stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.expired,payment_intent.payment_failed --forward-to localhost:3000/api/stripe/webhook` and copy its signing secret into `.env.local` manually.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Sign in, add a dish, click **Order this thali**, review the payment page, choose **Continue to secure payment**, and complete checkout using `4242 4242 4242 4242`, a future expiry date, any three-digit CVC and any requested test billing details. [Stripe test-card reference](https://docs.stripe.com/testing).

6. The listener should show a successful webhook response. The success page should change from waiting to **Payment confirmed**, with the saved receipt and `paid` status. If the webhook is slow, it polls ten times, then offers **Check payment again**. A redirect alone never marks anything paid.

A browser cancellation returns to `/checkout/cancel?order_id=...`, where the owner can return to the review page and resume the existing payment session. Returning from Stripe's cancellation link does not itself change payment status. Abandoned sessions become `expired` when their signed expiration event arrives.

### Payment tables and routes

| Table | Purpose |
| --- | --- |
| `orders` | One purchase, owned by a signed-in user: UUID, retry key, pending/paid/expired status, INR total in paise, Stripe session/payment-intent IDs and timestamps |
| `order_items` | One row per purchased dish: dish reference, saved name, quantity and unit price in paise |

`order_items` is the SQL equivalent of the assignment's `orderItems`. It follows this repository's snake_case table convention. `dishes.price` is in whole rupees; checkout multiplies it by 100. ₹420 becomes 42000 paise. Later changes to menu prices or names cannot change a saved receipt.

| Method | Route | Behavior |
| --- | --- | --- |
| POST | `/api/checkout` | Requires a session and same-origin request; accepts `{ checkoutKey, items: [{ dishId, qty }] }`; returns `{ orderId, url }` |
| GET | `/api/orders/:id` | Requires the owning user's session; returns order status and saved line items, with caching disabled |
| POST | `/api/stripe/webhook` | Public to Stripe; verifies the raw payload signature before accessing order records |
| GET | `/checkout?order_id=...` | Branded order review with dish photos, saved prices, total and a link to the existing Stripe Session |
| GET | `/checkout/success?order_id=...` | Displays the owner's saved status and polls while pending |
| GET | `/checkout/cancel?order_id=...` | Displays the order and offers resume payment while pending |

The checkout service validates integer IDs, quantities and duplicate dishes. It ignores browser prices, totals and user IDs. It saves the pending order and snapshots in one transaction, then creates the real Stripe Session outside the transaction. A unique `(user_id, checkout_key)` constraint and Stripe idempotency key prevent retries of the same attempt from producing duplicate purchases. If Stripe times out, retrying uses the original order and original prices. A failed checkout call never sets `paid`.

The webhook checks the signed event's application metadata, user ID, order ID, session ID, payment status, amount, currency and test-mode flag. It locks the order while updating it, handles duplicate deliveries safely, and never downgrades a paid order on a late expiration event. A paid event can arrive before checkout saves its session ID. Database failures return 500 so Stripe can retry. See [Stripe's signature guidance](https://docs.stripe.com/webhooks/signature).

`/api/health` reports whether the test key and webhook signing secret are present, using booleans only. Those flags do not verify the credentials with Stripe. Both settings are required before checkout opens.

### Verification

```bash
npm test
npm run lint
npm run build
# Against a running app (read-only):
npm run test:smoke
# Database integration suite (temporary fixtures are created and removed):
npm run test:payments
```

The payment integration suite uses the configured database and the real Stripe SDK's signature implementation. It mocks Stripe API calls and checks price tampering, purchase snapshots, other-user lookups, concurrent retries, timed-out requests, duplicate events, invalid amounts/currencies/sessions, expiration and webhooks arriving before session persistence. It removes only its own generated fixture users, dishes and orders. These tests do **not** replace completing the real hosted checkout with the CLI listener running.

### Deployment

Keep using **test** keys on the deployed site for this assignment; a deployed URL does not require real-money live mode.

1. Add `STRIPE_SECRET_KEY` to Vercel using the Stripe test key, and set `BETTER_AUTH_URL` to the exact public HTTPS origin.
2. In Stripe's test environment, register `https://YOUR-SITE/api/stripe/webhook` as a webhook endpoint for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired` and `payment_intent.payment_failed`.
3. Put that endpoint's own signing secret in Vercel's `STRIPE_WEBHOOK_SECRET` and redeploy. The local CLI secret does not belong here.
4. Run the schema migration against the deployed app's database, then complete the hosted test-card flow on the deployed URL and check Stripe's event delivery log.

### Assessment walkthrough

Show the menu, sign in, pick dishes and click **Order this thali**. Explain that the API reads prices from `dishes`, saves a pending `orders` row plus its `order_items`, and creates a Checkout Session. Pay using the test card, show the verified webhook in the CLI and the paid success page, then show the database rows. Explain that the success page only reads status; the signature-verified webhook is the only application code that writes `paid`. See [the assessment guide](docs/PAYMENTS_ASSESSMENT.md) for file paths and database queries.

The older files in `docs/` describe the pre-migration Vite/Express project and are retained as historical assessment notes. Use this README for the current setup and file paths.

## Visual design and animation

The site follows a Konark coastline: locally hosted ocean footage crossfades into a generated restaurant exterior, the camera pushes toward the terrace as you scroll, and a separate dining-room/food scene introduces the menu. Sea blue, sand and brass carry through both lunch and dinner palettes. Dish photographs assemble in the existing live thali. Motion respects reduced-motion preferences and can be paused from the fixed control or footer. See [design notes](docs/DESIGN_NOTES.md) and [coastal asset prompts and video credits](docs/KONARK_ASSET_PROMPTS.json).


## Accounts and email confirmation

`/sign-in` has an animated coastal sign-in/create-account screen. `/account` provides private, paginated order history; paid, awaiting-payment and unsuccessful filters; name editing; email verification and changes; and password changes. Order history reads purchase snapshots, rather than current menu prices. A failed card attempt is recorded by a signed `payment_intent.payment_failed` webhook and remains retryable. It cannot undo a paid order. An abandoned checkout is shown as expired once Stripe sends its expiration event.

For email delivery, add these **privately** to `.env.local` and restart the app:

```dotenv
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="Tamarind & Tide <hello@your-verified-domain.example>"
```

Use an actual sender on your verified Resend domain, following [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction). The example address above is a placeholder. Set both variables in your hosting environment too. No browser-accessible key is needed.

A verification link expires after one hour. Email changes do not update the account until the new address is verified. A verified current address must also approve the change first. Password changes require the current password and sign out other sessions. When delivery is unconfigured, the account page explains that email actions are unavailable; it never pretends an address is verified. Actual inbox delivery still needs to be checked after configuring Resend.

| Method | URL | Login required |
| --- | --- | --- |
| GET | `/api/orders?page=1&status=all` | Yes; only the session owner's orders |
| GET | `/api/account/settings` | Yes; email availability only |

`status` accepts `all`, `paid`, `pending` or `unsuccessful`. Name, email and password changes use Better Auth's protected endpoints. Additional checks:

```bash
npm run test:payments
npm run test:accounts
```

These integration checks create disposable fixtures in the configured database and remove only their own fixtures. Account verification emails are captured in memory for tests; no mail is sent. The footer credits Roman Parwez and embeds an interactive Google map centred on Konark, Odisha. It is an area map until a precise restaurant address is supplied.

## Living restaurant update

The menu now contains **30 dishes** across Indian, Continental, Chinese and Italian cuisines, with cuisine/course filters, search and matching photographs. Apply `npm run db:migrate` followed by `npm run db:expand-menu` when deploying this update. Existing product prices and saved receipts are preserved.

Reservations have moved to **`/reservations`** with Ocean View, Classic and Chef’s Counter setting previews, live availability, table selection, floor plan and a personal welcome note after a confirmed booking. The home page introduces the settings and links to this separate flow. Shared ocean backgrounds and photographic motion continue across account, sign-in and payment routes. The Chef’s kiss scene animates an orderable signature dish into the chef’s palm as you scroll. The site-wide pause control persists through navigation and respects reduced-motion preferences.

See [implementation and design notes](docs/LIVING_EXPERIENCE.md) and [new image paths and prompts](docs/EXPERIENCE_ASSET_PROMPTS.json). Run `npm run test:bookings` against the running app for the disposable reservation integration checks.

### Order cancellation and refunds

Use **My account → Your orders → Cancel order & refund**, or cancel from the order receipt. Unpaid checkouts are closed at Stripe; paid orders receive a full test-mode refund to the original payment method. Status updates, original receipts and purchase amounts remain visible. Table reservations are separate.

Run `npm run db:migrate`, then restart `npm run stripe:listen` to include refund webhook events. On a deployed test site, enable `refund.created`, `refund.updated` and `refund.failed` on the existing webhook. Validate with `npm run test:refunds`. See [the implementation and testing notes](docs/ORDER_REFUNDS.md).
