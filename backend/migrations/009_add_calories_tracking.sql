-- Migration 009: Add Calories Tracking

ALTER TABLE activities ADD COLUMN IF NOT EXISTS calories_burned INTEGER;

CREATE INDEX IF NOT EXISTS idx_activities_calories ON activities(calories_burned);

-- Update existing activities with calculated calories (default estimate)
-- This will be recalculated properly when user submits new activities
UPDATE activities 
SET calories_burned = CASE
  WHEN type = 'Running' THEN ROUND(distance_km * 62)::INTEGER  -- ~62 cal/km
  WHEN type = 'Cycling' THEN ROUND(distance_km * 31)::INTEGER  -- ~31 cal/km
  WHEN type = 'Swimming' THEN ROUND(duration_min * 11)::INTEGER  -- ~11 cal/min
  WHEN type = 'Walking' THEN ROUND(distance_km * 50)::INTEGER  -- ~50 cal/km
  WHEN type = 'Hiking' THEN ROUND(distance_km * 55)::INTEGER  -- ~55 cal/km
  ELSE ROUND(duration_min * 8)::INTEGER  -- ~8 cal/min fallback
END
WHERE calories_burned IS NULL;
