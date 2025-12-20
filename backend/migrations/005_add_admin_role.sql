-- Migration 005: Add admin role to users
-- Date: December 20, 2025
-- Purpose: Add admin role for community/championship management

-- Add admin role to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set your account as admin (update with your actual user ID or email)
-- UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

COMMENT ON COLUMN users.is_admin IS 'Admin users can create communities, manage championships, approve registrations';
