#!/usr/bin/env node
// backend/create-2026-championship.mjs
// Quick script to create 2026 championship

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('Creating 2026 championship...\n');

const championship2026 = {
  year: 2026,
  start_date: '2026-01-01',
  end_date: '2026-12-31',
  registration_fee: 500,
  prize_pool: 0,
  finale_date: '2026-12-15',
  finale_location: 'Nairobi',
  status: 'active',
  registration_open: true,
  registration_opens_at: '2026-01-01 00:00:00',
  qualifications_close_at: '2026-11-15 23:59:59',
  spectator_price: 5000,
  participant_price: 10000
};

try {
  const result = await pool.query(`
    INSERT INTO annual_championships 
    (year, start_date, end_date, registration_fee, prize_pool, finale_date, 
     finale_location, status, registration_open, registration_opens_at, 
     qualifications_close_at, spectator_price, participant_price)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (year) DO UPDATE SET
      registration_open = EXCLUDED.registration_open,
      registration_opens_at = EXCLUDED.registration_opens_at,
      qualifications_close_at = EXCLUDED.qualifications_close_at
    RETURNING *
  `, [
    championship2026.year,
    championship2026.start_date,
    championship2026.end_date,
    championship2026.registration_fee,
    championship2026.prize_pool,
    championship2026.finale_date,
    championship2026.finale_location,
    championship2026.status,
    championship2026.registration_open,
    championship2026.registration_opens_at,
    championship2026.qualifications_close_at,
    championship2026.spectator_price,
    championship2026.participant_price
  ]);

  console.log('✅ Championship 2026 created successfully!');
  console.log(JSON.stringify(result.rows[0], null, 2));
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await pool.end();
}
