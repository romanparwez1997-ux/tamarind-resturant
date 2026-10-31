# Order cancellation and full test refunds

Customers can open **My account → Your orders** or an order receipt and choose **Cancel order**. A paid order shows **Cancel order & refund**, followed by a confirmation that includes the full amount. Table reservations are managed separately.

An unpaid cancellation retrieves and expires the real Stripe Checkout Session before marking the purchase `cancelled`. If payment is completing, the API asks the customer to wait for its signed webhook and then request a refund. The redirect named `/checkout/cancel` remains a checkout pause; visiting it does not cancel anything.

A paid purchase keeps its `paid` status and original `paid_at` for an accurate payment history. Separate fields track cancellation and refund progress: `cancelled_at`, `refund_request_id`, `stripe_refund_id`, `refund_status`, `refund_requested_at`, and `refunded_at`. The account and receipt show Refund requested, Refund processing, Refunded, or Refund unsuccessful. Only Stripe-confirmed success displays Refunded. The original receipt and item prices remain unchanged.

`POST /api/orders/:id/cancel` requires a signed-in owner and the configured same-site Origin. It accepts no browser-supplied amount, user ID, payment ID, or refund destination. The saved total and PaymentIntent determine the full refund. This assignment has no fulfilment workflow or cancellation deadline, so any confirmed paid test order can request a full refund.

A row lock claims one stable server-generated refund request ID. Stripe calls happen after the transaction closes, using that ID as the idempotency key. If a response is lost, retries retrieve the refund or recover it from Stripe's payment-specific refund history, including after the idempotency cache expires. A failed refund is retained for restaurant follow-up; clicking again never automatically creates another refund.

The verified raw-body webhook handles `refund.created`, `refund.updated`, and `refund.failed`. It validates order, owner, request ID, amount, currency, PaymentIntent and refund identity. Duplicate and out-of-order events cannot revert a terminal outcome to pending or erase a reported failure. Both the authenticated API response and verified refund events can update a refund; only the existing verified payment webhook can mark a purchase paid.

Apply the additive schema with `npm run db:migrate`. Restart `npm run stripe:listen` so it subscribes to the three refund events. For a deployed test site, add those event types to the existing Stripe Dashboard webhook endpoint. Keep test-mode keys; no live-money support is enabled.

Checks: `npm run lint`, `npm test`, `npm run test:payments`, `npm run test:refunds`, `npm run test:smoke`, and `npm run build`. The refund integration test uses disposable database fixtures, mocked Stripe network requests, and real Stripe signature verification. It covers ownership, concurrent cancellation/refund requests, a payment race, lost responses, early and replayed webhooks, and refund failure. It removes only its own fixtures.

Tailwind scans only the active `src` tree, rather than repository documents and the legacy application folders. This also keeps development and builds from reading unrelated iCloud-offloaded files.

Stripe references: [Refund API](https://docs.stripe.com/api/refunds/create), [Refund events and states](https://docs.stripe.com/refunds), [Expire Checkout](https://docs.stripe.com/api/checkout/sessions/expire).
