-- Migration 004: Update Communities and Championship Models
-- Date: December 20, 2025
-- Purpose: Curated communities + Public championship with ticket types

-- Add admin approval for communities (only you can create communities)
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_fee DECIMAL(10,2) DEFAULT 0;

-- Add championship registration control
ALTER TABLE annual_championships
ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_opens_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS qualifications_close_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS spectator_price DECIMAL(10,2) DEFAULT 5000,
ADD COLUMN IF NOT EXISTS participant_price DECIMAL(10,2) DEFAULT 10000;

-- Create ticket types for championship
CREATE TABLE IF NOT EXISTS championship_tickets (
  id SERIAL PRIMARY KEY,
  championship_id INTEGER REFERENCES annual_championships(id),
  user_id INTEGER REFERENCES users(id),
  ticket_type VARCHAR(20) NOT NULL CHECK (ticket_type IN ('spectator', 'participant', 'qualifier')),
  price DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference VARCHAR(255),
  participant_code VARCHAR(50) UNIQUE, -- Auto-generated for qualifiers and paid participants
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user ON championship_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_championship ON championship_tickets(championship_id);
CREATE INDEX IF NOT EXISTS idx_tickets_payment_status ON championship_tickets(payment_status);

-- Update existing communities to require approval
UPDATE communities SET is_approved = TRUE WHERE id IN (SELECT DISTINCT community_id FROM community_members);

COMMENT ON COLUMN communities.is_approved IS 'Only approved communities appear in app (admin curated)';
COMMENT ON COLUMN communities.registration_fee IS 'Fee organizations paid to register their community';
COMMENT ON COLUMN championship_tickets.participant_code IS 'Entry code for event day - sent to top 10 qualifiers automatically';
