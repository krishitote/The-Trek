import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const email = 'thetrekkenya@gmail.com';

pool.query('UPDATE users SET is_admin = true WHERE email = $1 RETURNING username, email, is_admin', [email])
  .then(res => {
    if (res.rows.length > 0) {
      console.log('✓ Admin status confirmed:');
      console.log('  Username:', res.rows[0].username);
      console.log('  Email:', res.rows[0].email);
      console.log('  Is Admin:', res.rows[0].is_admin);
    } else {
      console.log('❌ User not found with email:', email);
    }
    pool.end();
  })
  .catch(err => {
    console.log('Error:', err.message);
    pool.end();
  });
