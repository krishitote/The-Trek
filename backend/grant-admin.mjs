import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const username = 'Chris';

pool.query('UPDATE users SET is_admin = true WHERE username = $1 RETURNING username, email, is_admin', [username])
  .then(res => {
    if (res.rows.length > 0) {
      console.log('\n✓ Admin privileges granted!');
      console.log('  Username:', res.rows[0].username);
      console.log('  Email:', res.rows[0].email);
      console.log('  Is Admin:', res.rows[0].is_admin);
      console.log('\n🔒 You can now access the Admin Dashboard at https://trekfit.co.ke/admin');
    } else {
      console.log('❌ User not found with username:', username);
    }
    pool.end();
  })
  .catch(err => {
    console.log('Error:', err.message);
    pool.end();
  });
