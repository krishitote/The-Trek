import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Search by username
pool.query("SELECT id, username, email, is_admin, created_at FROM users WHERE LOWER(username) = LOWER('Admin')")
  .then(res => {
    console.log('\n🔍 Search by username "Admin":\n');
    if (res.rows.length === 0) {
      console.log('No user found with username "Admin"');
    } else {
      res.rows.forEach(u => {
        console.log(`${u.is_admin ? '👑' : '👤'} ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Admin: ${u.is_admin}`);
      });
    }
    
    // Search by email
    return pool.query("SELECT id, username, email, is_admin, created_at FROM users WHERE email = 'thetrekkenya@gmail.com'");
  })
  .then(res => {
    console.log('\n🔍 Search by email "thetrekkenya@gmail.com":\n');
    if (res.rows.length === 0) {
      console.log('No user found with email "thetrekkenya@gmail.com"');
    } else {
      res.rows.forEach(u => {
        console.log(`${u.is_admin ? '👑' : '👤'} ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Admin: ${u.is_admin}`);
      });
    }
    
    // Show all users
    return pool.query('SELECT id, username, email, is_admin FROM users ORDER BY id');
  })
  .then(res => {
    console.log('\n📋 ALL users in database:\n');
    res.rows.forEach(u => {
      console.log(`${u.is_admin ? '👑' : '👤'} ID: ${u.id}, Username: ${u.username || 'NULL'}, Email: ${u.email || 'NULL'}`);
    });
    pool.end();
  })
  .catch(err => {
    console.log('Error:', err.message);
    pool.end();
  });
