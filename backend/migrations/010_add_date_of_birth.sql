-- Migration 010: Replace age with date_of_birth
-- Fixes profile editing functionality

-- Drop age column if exists (not used by app)
ALTER TABLE users DROP COLUMN IF EXISTS age;

-- Add date_of_birth column (required by Profile.jsx)
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Create index for date queries and age calculations
CREATE INDEX IF NOT EXISTS idx_users_dob ON users(date_of_birth);
