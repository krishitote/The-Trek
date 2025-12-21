-- Migration 006: Add Weekly Goal
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_distance_goal DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date);
CREATE INDEX IF NOT EXISTS idx_activities_user_type ON activities(user_id, type);
