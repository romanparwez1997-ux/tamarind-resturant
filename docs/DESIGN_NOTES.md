# Konark coastal redesign

The current direction uses deep sea blue, pale sand, muted brass, Cormorant Garamond and DM Sans. The home page has three coordinated scenes rather than the earlier hero/plating sequence.

## Scene choreography

1. The shore: a locally hosted, muted ocean video loops behind masked headline entrances. It is a 12-second, 720p, 4.5 MB clip.
2. The house: scrolling crossfades the ocean into `public/images/konark-restaurant.png`, then pushes the camera toward the terrace with a fixed transform origin. The departing headline gives way to an invitation. The story continues in normal flow with an interior photograph.
3. The table: the menu opening fades in a dining-room scene and moves the plated dish into position. The existing horizontal course gallery leads to the actual filters and live photographic thali.

`CoastalBackdrop.jsx` manages the video and layered imagery. `useSceneMotion.js` batches scroll reads in requestAnimationFrame and writes CSS variables. Scrolling stays native. Video playback pauses when hidden, offscreen or manually paused; system reduced motion prevents playback. Motion-off mode shows a still restaurant photograph and normal document flow. The fixed pause control and footer control preserve all menu and booking functions.

Lunch and dinner use shared sea/sand colour tokens. Header, menu, reservations, payment and account pages support the selected appearance. The preference carries into account/payment navigation through session storage; no personal or payment data is saved there.

## Account spaces

`SignInPage.jsx` uses an ocean scene alongside the reusable `AuthForm.jsx`; contextual sign-in uses the same form inside an animated native dialog. `AccountPage.jsx` provides order history, profile details and password settings. Unsuccessful history distinguishes failed retryable attempts from expired checkouts. Data comes from owner-scoped server queries. Email actions are unavailable until delivery is configured; verification never happens just because a redirect parameter is present.

The footer credits Roman Parwez. The live Google Maps embed shows the Konark area, not an invented exact restaurant address. No phone number or public contact email was supplied.

## Visual sources

The exterior is an original fictional restaurant concept generated with the built-in imagegen tool. It is not a photograph of an existing venue. The ocean video is licensed stock footage by ArtHouse Studio, used as an atmospheric coast scene; it is not asserted to document Konark. Source, license and the exact generation prompt are in `docs/KONARK_ASSET_PROMPTS.json`.

Existing food images are generated photographic illustrations in `public/images/dishes/`. All 14 seeded dish IDs map to matching images in `src/data/dishImages.js`. The empty tray and cutouts retain transparency. Existing dishes and purchase snapshots are preserved. Original prompts remain in `docs/IMAGE_PROMPTS.json` and `docs/DISH_IMAGE_PROMPTS.json`.

## Checkout

The restaurant-branded `/checkout` review still loads the owner's saved order, quantities and prices. Stripe hosts the card form. The signed webhook is still the only code allowed to mark an order paid. The new failed-payment event stores an error code and timestamp without marking an order paid or undoing a payment. The success page continues to read and poll database status.

## Verification

Run build, lint and unit tests, the read-only HTTP smoke checks, and the disposable payment/account integration suites. Test phone/desktop layout, theme changes, video pause, menu selection, account filters, receipts, maps, and email configuration states. Real Resend inbox delivery remains a separate check once a sender is configured.

Verified locally on 30 October 2026: production build and lint pass; nine unit checks pass; HTTP smoke checks pass; database-backed account and payment integration suites pass. Account tests use disposable users and in-memory email capture, including both email-confirmation stages and password-session revocation. A real Stripe sandbox Checkout Session with the new payment metadata was created and expired; the signed expiration event reached localhost, and the disposable database rows were removed. Desktop and 412px Chrome previews showed the coastal hero, account history and dinner palette without horizontal overflow; the pause control stopped the video and removed pinned scrolling. The Google embed loaded its Konark map controls. Chrome interrupted the last preview interaction while another panel was active. Real Resend delivery is still pending sender configuration.
