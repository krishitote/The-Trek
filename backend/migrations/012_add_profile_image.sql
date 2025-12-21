-- Migration 012: Add profile_image column to users table
-- Required by profile update and upload endpoints

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Create index for faster queries when filtering by profile images
CREATE INDEX IF NOT EXISTS idx_users_profile_image ON users(profile_image) WHERE profile_image IS NOT NULL;
