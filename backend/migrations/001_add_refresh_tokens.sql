-- Migration: Add refresh token columns to users table
-- Run this on your Neon database

-- Add refresh token columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token_expires TIMESTAMP;

-- Create index for faster refresh token lookups
CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token);

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('refresh_token', 'refresh_token_expires');
