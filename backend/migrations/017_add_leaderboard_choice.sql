BEGIN;

-- New sign-ups must not start with 0 kg / 0 cm: migration 014 requires these to be positive or NULL.
ALTER TABLE users ALTER COLUMN height DROP DEFAULT;
ALTER TABLE users ALTER COLUMN weight DROP DEFAULT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS leaderboard_choice_made_at TIMESTAMPTZ;

-- Anyone already opted in has made a choice; everyone else is asked once.
UPDATE users
SET leaderboard_choice_made_at = NOW()
WHERE show_on_leaderboard = TRUE AND leaderboard_choice_made_at IS NULL;

CREATE INDEX IF NOT EXISTS activities_date_idx ON activities (date DESC);

COMMIT;
