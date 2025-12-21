-- Migration 004: Add Championships Table
CREATE TABLE IF NOT EXISTS championships (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_championships_dates ON championships(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_championships_active ON championships(is_active);
