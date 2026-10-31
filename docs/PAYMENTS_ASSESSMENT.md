# Assignment 4: thali payments

Payments buy dishes. A table reservation is a separate, free action.

## Verified local transaction — 30 October 2026

The browser flow was completed with Stripe's 4242 test card: one Goli Baje, ₹220. Stripe delivered `checkout.session.completed`, the local webhook returned HTTP 200, and the success page displayed **Payment confirmed** with `Status: paid`.

Saved order: `b72762b5-c09b-40dc-8cda-5844616b462d`. Use this row as an example during preparation; complete a new payment live at assessment. The test transaction charged no real money.

Checkout now uses Stripe's Dashboard-managed payment methods; the current API rejects the older `payment_method_types` request field. If a previously attempted request has incompatible cached parameters, the server returns 409 so the browser can start a fresh checkout attempt.

## Start the demo

1. Set `STRIPE_SECRET_KEY` in the root `.env.local` to your Stripe **test** secret key. Do not use `server/.env`; this is now a single Next.js app.
2. Run `npm run db:migrate` once after schema changes.
3. Run `npm run stripe:listen` in one terminal. It uses the official CLI, saves the signing secret privately, and must stay running.
4. Start/restart `npm run dev` in another terminal. Open the exact origin from `BETTER_AUTH_URL`, normally http://localhost:3000. If that port is occupied, stop the old app before restarting; authentication and checkout use this configured origin.
5. Sign in, choose a dish and click **Order this thali**. Review the dish photos, quantities and saved total on the site's payment page, then click **Continue to secure payment**.
6. On Stripe's hosted page, enter `4242 4242 4242 4242`, a future expiration and any three-digit CVC.
7. Show the CLI delivery with HTTP 200, then **Payment confirmed** and `Status: paid` on the receipt.

If the webhook arrives after the redirect, the page checks every two seconds, up to ten times. **Check payment again** starts another round. A waiting page is never proof of payment. Keep the listener running during the entire demo.

## Explain the flow

| Step | File | What to explain |
| --- | --- | --- |
| Button | `src/App.jsx`, `src/components/Thali.jsx` | Send dish IDs and quantities with a retry key; open the site's review page with the returned order ID. |
| Login | `src/server/requireAuth.js` | Read the real Better Auth session; reject anonymous checkout with 401. |
| Checkout route | `src/app/api/checkout/route.js` | Require login and the configured origin; never accept a user ID or payment amount from the browser. |
| Purchase | `src/server/payments.js` (`createCheckout`) | Read real prices from `dishes`, save the pending order and item snapshots, then create a Stripe Checkout Session. |
| Review | `src/components/CheckoutReview.jsx` | Load the saved receipt through the owner-only API; continue to the existing Stripe Session. |
| Verification | `src/server/stripeWebhook.js` | Verify the raw body with Stripe's SDK and the signing secret before processing it. |
| Paid status | `src/server/payments.js` (`applyCheckoutEvent`) | Match the order, owner, session, paid status, total and currency. This webhook path is the only application code that sets `paid`. |
| Lookup | `src/app/api/orders/[id]/route.js` | Only the order's owner can read it. This endpoint never changes payment status. |
| Receipt | `src/components/OrderStatus.jsx` | Poll the saved order; show confirmed payment only when the database says `paid`. |

The two payment tables are in `db/schema.sql`. `order_items` is the SQL name for the assignment's `orderItems`, consistent with this project's table naming.

`orders` contains the user, total, status, Stripe references and timestamps. `order_items` contains each dish, its purchased name, its unit price and quantity. These item snapshots preserve the receipt if the menu changes later. Payment amounts are integers in **paise**: a ₹240 dish is saved as 24000; two portions total 48000.

## Show the database

Run these read-only queries in the Neon SQL editor:

```sql
SELECT id, user_id, status, currency, total_amount, stripe_session_id,
       stripe_payment_intent_id, created_at, paid_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

For the UUID on the success page:

```sql
SELECT dish_id, dish_name, unit_amount, qty, unit_amount * qty AS line_total
FROM order_items
WHERE order_id = 'PASTE-ORDER-UUID-HERE'
ORDER BY dish_id;
```

## What the automated checks prove

`npm test` verifies request validation, ignored browser prices and signature rejection. `npm run test:payments` uses isolated database fixtures and mocked Checkout API calls to verify stored prices, ownership, retries, duplicate deliveries and webhook timing. `npm run test:smoke` checks the running application's routes and receipt rendering without creating purchases.

These checks do not replace the real hosted test-card transaction above. A generic `stripe trigger checkout.session.completed` fixture does not contain this application's order metadata and therefore cannot pay one of your orders.

For deployment, keep Stripe in test mode. Use the deployed webhook endpoint's signing secret rather than the local listener secret; follow the README deployment steps.
