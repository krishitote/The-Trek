-- Migration 013: Add Google Fit OAuth tokens table
-- Stores Google OAuth tokens for each user to enable fitness data sync

CREATE TABLE IF NOT EXISTS google_fit_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_google_fit_tokens_user_id ON google_fit_tokens(user_id);
CREATE INDEX idx_google_fit_tokens_expires_at ON google_fit_tokens(token_expires_at);
