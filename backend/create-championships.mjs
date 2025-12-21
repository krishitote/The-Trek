import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const sql = `
CREATE TABLE IF NOT EXISTS championships (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_championships_dates ON championships(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_championships_active ON championships(is_active);
`;

console.log('Creating championships table...');

pool.query(sql)
  .then(() => {
    console.log('✓ Championships table created successfully');
    pool.end();
  })
  .catch(err => {
    console.log('Error:', err.message);
    pool.end();
  });
