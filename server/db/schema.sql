-- Tamarind & Tide database schema.
-- Run with:  npm run db:migrate   (safe to run again: everything is IF NOT EXISTS)

------------------------------------------------------------------------------
-- 1. AUTH TABLES — used by Better Auth (src/auth.js). We never query these
--    ourselves except to join a booking to its user. Column names are the
--    ones Better Auth expects, so they are camelCase and must be "quoted".
------------------------------------------------------------------------------

-- One row per person who signs up.
CREATE TABLE IF NOT EXISTS "user" (
  "id"            TEXT PRIMARY KEY,
  "name"          TEXT NOT NULL,
  "email"         TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image"         TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per logged-in browser. The token is stored in a cookie;
-- every request sends it back and Better Auth looks it up here.
CREATE TABLE IF NOT EXISTS "session" (
  "id"        TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "token"     TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId"    TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- How a user logs in. For email + password, providerId = 'credential' and
-- "password" holds a HASH of the password (never the password itself).
CREATE TABLE IF NOT EXISTS "account" (
  "id"                    TEXT PRIMARY KEY,
  "accountId"             TEXT NOT NULL,
  "providerId"            TEXT NOT NULL,
  "userId"                TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken"           TEXT,
  "refreshToken"          TEXT,
  "idToken"               TEXT,
  "accessTokenExpiresAt"  TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  "scope"                 TEXT,
  "password"              TEXT,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Short-lived codes (e.g. password reset). Required by Better Auth.
CREATE TABLE IF NOT EXISTS "verification" (
  "id"         TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value"      TEXT NOT NULL,
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS session_user_idx ON "session"("userId");
CREATE INDEX IF NOT EXISTS account_user_idx ON "account"("userId");

------------------------------------------------------------------------------
-- 2. RESTAURANT TABLES — our own data. Plain snake_case names.
------------------------------------------------------------------------------

-- The menu (was the hardcoded `dishes` array in Week 2).
-- id is a fixed menu number set by the seed script, so it is not SERIAL.
CREATE TABLE IF NOT EXISTS dishes (
  id          INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  course      TEXT    NOT NULL CHECK (course IN ('starters', 'mains', 'desserts')),
  service     TEXT    NOT NULL CHECK (service IN ('lunch', 'dinner', 'both')),
  veg         BOOLEAN NOT NULL,
  price       INTEGER NOT NULL CHECK (price > 0),          -- whole rupees
  description TEXT    NOT NULL,
  spice       INTEGER NOT NULL CHECK (spice BETWEEN 0 AND 3),
  chefs_pick  BOOLEAN NOT NULL DEFAULT FALSE,
  tag         TEXT                                          -- optional label
);

-- The 9 tables in the dining room (was the hardcoded `tables` array).
-- x / y are where the table is drawn on the floor plan, in %.
CREATE TABLE IF NOT EXISTS dining_tables (
  id    TEXT    PRIMARY KEY,                                -- 'T1' … 'T9'
  seats INTEGER NOT NULL CHECK (seats > 0),
  zone  TEXT    NOT NULL,
  x     INTEGER NOT NULL,
  y     INTEGER NOT NULL
);

-- A reservation. Belongs to one user and one dining table.
CREATE TABLE IF NOT EXISTS bookings (
  id           SERIAL  PRIMARY KEY,
  user_id      TEXT    NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  table_id     TEXT    NOT NULL REFERENCES dining_tables(id),
  booking_date DATE    NOT NULL,
  seating      TEXT    NOT NULL,                            -- e.g. '7:00 pm'
  guests       INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 6),
  name         TEXT    NOT NULL,
  phone        TEXT    NOT NULL,
  occasion     TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- The database itself refuses a second booking for the same table,
  -- day and seating, even if two people click "Request" at the same moment.
  UNIQUE (table_id, booking_date, seating)
);

CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings(user_id);

-- The thali pre-ordered with a booking: one row per dish, with how many plates.
-- (A "join table" between bookings and dishes.)
CREATE TABLE IF NOT EXISTS booking_items (
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  dish_id    INTEGER NOT NULL REFERENCES dishes(id),
  qty        INTEGER NOT NULL CHECK (qty > 0),
  PRIMARY KEY (booking_id, dish_id)
);
