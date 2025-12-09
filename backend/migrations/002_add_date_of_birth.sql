-- Migration: Add date_of_birth column to users table
-- Date: 2025-12-09
-- Description: Replace age (integer) with date_of_birth (DATE) for more accurate age calculation

-- Add date_of_birth column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Optional: Drop age column if you want to completely remove it
-- Uncomment the line below if you want to remove the age column
-- ALTER TABLE users DROP COLUMN IF EXISTS age;

-- Add index for faster birthday queries (optional)
CREATE INDEX IF NOT EXISTS idx_users_date_of_birth ON users(date_of_birth);

-- Update validation: Ensure date_of_birth is in the past
ALTER TABLE users 
ADD CONSTRAINT check_dob_in_past 
CHECK (date_of_birth IS NULL OR date_of_birth < CURRENT_DATE);
