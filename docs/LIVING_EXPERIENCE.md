# The living restaurant experience

The restaurant now has a shared motion layer across home, reservations, sign-in, account, checkout, payment status and receipts. A locally hosted ocean film continues between Next.js page links. Home keeps its own foreground coastline; other pages show the film beneath translucent surfaces. All motion uses one native requestAnimationFrame clock, with frame-rate-independent easing toward actual scroll progress. Scrolling itself stays native.

`SiteMotion.jsx` owns the shared atmosphere and session-only pause preference. `MotionSurface.jsx` opts each streamed page into animation after hydration, preventing animation code from changing server HTML too soon. `useSceneMotion.js` eases scene variables, observes photo visibility and stops running frames once movement settles. Offscreen photo animations pause. Reduced-motion preferences prevent video playback and remove pinned scenes. Manual pause works throughout navigation.

## Chef’s kiss

`ChefSpecial.jsx` uses a new original chef cutout and a separate photograph of Tandoori Jhinga. Scrolling moves the plate from the headline toward the chef’s open palm. The final pose aligns with the generated hand. The price and order action use dish 16 from the database; the button adds that actual dish to the existing cart. Desktop uses a pinned scene; smaller screens keep it in normal flow.

## Thirty dishes, four cuisines

The database now has a constrained `cuisine` column: `indian`, `continental`, `chinese`, or `italian`. There are 30 products in the full catalogue, with the existing lunch/dinner rules retained. Sixteen new dishes cover paneer tikka, tandoori prawns, butter chicken, biryani, soup, grilled fish, roast chicken, chocolate fondant, dim sum, chilli chicken, Hakka noodles, kung pao chicken, burrata, pizza, pasta and tiramisu. Every product has a matching local photographic asset.

Cuisine and course filters work together with search, vegetarian selection and spice limits. The gallery introduces all four kitchens. Longer results load eight at a time. The root `CartProvider` keeps dish IDs and quantities through page changes and reloads in session storage. It validates the draft and stores no prices, identity or payment status. Checkout still uses server prices, and only a signature-verified Stripe webhook may mark payment as paid.

Apply the schema and catalogue on another environment with:

```bash
npm run db:migrate
npm run db:expand-menu
```

The expansion adds only missing new products, refuses conflicting IDs and leaves existing prices, descriptions and order snapshots alone. Fresh databases may use the updated full seed instead.

## Separate reservations

`/reservations` provides three setting previews: Ocean View for window tables, Classic for courtyard tables and Chef’s Counter for counter seating. Table capacities, IDs and availability come from the real database. The photographs illustrate each setting; individual positions are shown in the floor plan. No paid seating tiers or invented exact views are implied.

Customers choose date, guests, seating and table before confirming. Availability failures keep table selection disabled rather than displaying an empty booked list. Stale requests are aborted. The server checks capacity and ownership, and the database prevents simultaneous reservations of the same table/date/seating. Food ordering and table reservations remain separate.

After the server saves a booking, a photographic confirmation opens with a handwritten-style welcome note. Birthday, anniversary and first-visit occasions have personal wording. The confirmation shows the actual booking number, table, date and party size. It does not claim an email or WhatsApp message was sent.

## Original assets

Twenty new visuals were generated with the built-in imagegen tool: sixteen food cutouts, three setting photographs and one fictional chef cutout. Project paths and exact prompts are in `docs/EXPERIENCE_ASSET_PROMPTS.json`. The illustrations depict a fictional venue, chef and menu; they are not photographs documenting a real restaurant. The existing ocean film credit and license remain in `docs/KONARK_ASSET_PROMPTS.json`.

## Checks

Use `npm run lint`, `npm test`, `npm run build`, `npm run test:smoke`, `npm run test:payments` and `npm run test:bookings`. The booking suite creates disposable accounts, verifies capacity, concurrent duplicate protection, owner-only history/cancellation and separation from payment orders, then removes only its own fixtures.
