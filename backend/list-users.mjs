import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query('SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT 10')
  .then(res => {
    console.log('\n📋 Users in production database:\n');
    if (res.rows.length === 0) {
      console.log('No users found');
    } else {
      res.rows.forEach(u => {
        console.log(`${u.is_admin ? '👑' : '👤'} ${u.username} (${u.email}) - Admin: ${u.is_admin}`);
      });
    }
    pool.end();
  })
  .catch(err => {
    console.log('Error:', err.message);
    pool.end();
  });
