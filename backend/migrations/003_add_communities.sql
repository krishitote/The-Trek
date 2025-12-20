-- Migration: Add Communities/Groups System + Grand Finale Features
-- Date: 2025-12-19
-- Description: Enable group competitions while maintaining individual leaderboards

-- ==================== COMMUNITIES ====================
-- Communities/Groups table
CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  invite_code VARCHAR(50) UNIQUE NOT NULL,
  is_private BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Community members
CREATE TABLE IF NOT EXISTS community_members (
  id SERIAL PRIMARY KEY,
  community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_communities_invite_code ON communities(invite_code);

-- ==================== ACTIVITY ENHANCEMENTS ====================
-- Add location and elevation to activities
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS location VARCHAR(200),
ADD COLUMN IF NOT EXISTS elevation_gain INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Index for location filtering
CREATE INDEX IF NOT EXISTS idx_activities_location ON activities(location);

-- ==================== GRAND FINALE SYSTEM ====================
-- Annual championship table
CREATE TABLE IF NOT EXISTS annual_championships (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_fee DECIMAL(10,2) DEFAULT 0,
  prize_pool DECIMAL(10,2) DEFAULT 0,
  finale_date DATE,
  finale_location VARCHAR(200),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'registration', 'completed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Championship participants (top 10 per gender who paid)
CREATE TABLE IF NOT EXISTS championship_participants (
  id SERIAL PRIMARY KEY,
  championship_id INTEGER REFERENCES annual_championships(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  gender VARCHAR(20),
  rank_at_registration INTEGER,
  total_distance DECIMAL(10,2),
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'confirmed'
  payment_amount DECIMAL(10,2),
  payment_date TIMESTAMP,
  final_rank INTEGER,
  registered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(championship_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_championship_participants_championship ON championship_participants(championship_id);
CREATE INDEX IF NOT EXISTS idx_championship_participants_user ON championship_participants(user_id);

-- ==================== CONTRIBUTIONS/PAYMENTS ====================
-- Track contributions towards grand finale
CREATE TABLE IF NOT EXISTS contributions (
  id SERIAL PRIMARY KEY,
  championship_id INTEGER REFERENCES annual_championships(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'prize_pool', -- 'prize_pool', 'registration', 'donation'
  payment_method VARCHAR(50),
  transaction_ref VARCHAR(200),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_championship ON contributions(championship_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user ON contributions(user_id);

-- ==================== SEED DATA ====================
-- Create 2025 championship
INSERT INTO annual_championships (year, start_date, end_date, registration_fee, finale_date, finale_location, status)
VALUES (
  2025,
  '2025-01-01',
  '2025-12-31',
  1000.00,
  '2026-01-15',
  'Nairobi, Kenya',
  'active'
) ON CONFLICT (year) DO NOTHING;

-- Verify tables
SELECT 'Communities table created' AS status, COUNT(*) AS count FROM communities
UNION ALL
SELECT 'Community members table created', COUNT(*) FROM community_members
UNION ALL
SELECT 'Annual championships created', COUNT(*) FROM annual_championships;
