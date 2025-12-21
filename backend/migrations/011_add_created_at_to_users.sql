-- Migration 011: Add created_at to users table
-- Enables real user growth analytics in admin dashboard

-- Add created_at for user registration tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Optional: Backfill existing users with current timestamp
-- Comment out if you want to keep NULL for historical data distinction
UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
