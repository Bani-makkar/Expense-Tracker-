-- Same schema the server applies automatically on startup (server/db/schema.js).
-- Run manually with: psql $DATABASE_URL -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  salt            TEXT,
  updated         TIMESTAMPTZ,
  created         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  incurred_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes       TEXT,
  updated     TIMESTAMPTZ,
  created     TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS expenses_user_date_idx
  ON expenses (recorded_by, incurred_on);
