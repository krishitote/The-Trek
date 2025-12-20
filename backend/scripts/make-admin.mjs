#!/usr/bin/env node
// backend/scripts/make-admin.mjs
// Usage: node scripts/make-admin.mjs <email>

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node scripts/make-admin.mjs <email>');
  process.exit(1);
}

try {
  const result = await pool.query(
    'UPDATE users SET is_admin = TRUE WHERE email = $1 RETURNING id, username, email, is_admin',
    [email]
  );

  if (result.rows.length === 0) {
    console.error(`❌ User with email "${email}" not found`);
  } else {
    const user = result.rows[0];
    console.log('✅ Admin access granted!');
    console.log(`   User: ${user.username} (${user.email})`);
    console.log(`   ID: ${user.id}`);
  }
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await pool.end();
}
