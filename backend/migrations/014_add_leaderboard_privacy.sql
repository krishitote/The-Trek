BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET weight = CASE WHEN weight <= 0 THEN NULL ELSE weight END,
   height = CASE WHEN height <= 0 THEN NULL ELSE height END
WHERE (weight IS NOT NULL AND weight <= 0)
  OR (height IS NOT NULL AND height <= 0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_weight_positive'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_weight_positive
      CHECK (weight IS NULL OR weight > 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_height_positive'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_height_positive
      CHECK (height IS NULL OR height > 0) NOT VALID;
  END IF;
END $$;

ALTER TABLE users VALIDATE CONSTRAINT users_weight_positive;
ALTER TABLE users VALIDATE CONSTRAINT users_height_positive;

CREATE INDEX IF NOT EXISTS activities_user_date_idx
  ON activities (user_id, date DESC);
CREATE INDEX IF NOT EXISTS activities_type_user_idx
  ON activities (type, user_id);

COMMIT;