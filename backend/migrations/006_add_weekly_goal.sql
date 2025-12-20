-- Migration 006: Add weekly distance goal and stats fields
-- Run this via Neon SQL Editor or psql

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS weekly_distance_goal DECIMAL(10,2) DEFAULT 0;

-- Index for faster stats queries
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_type ON activities(user_id, type);
