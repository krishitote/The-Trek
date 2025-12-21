import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

console.log('Checking championships...\n');

pool.query('SELECT * FROM championships ORDER BY created_at DESC LIMIT 5')
  .then(res => {
    if (res.rows.length === 0) {
      console.log('⚠️  Championships table exists but is EMPTY');
      console.log('The API returns an empty array, which might be causing frontend issues.\n');
    } else {
      console.log('Championships found:');
      res.rows.forEach(c => {
        console.log(`- ${c.name} (${c.start_date} to ${c.end_date}) - Active: ${c.is_active}`);
      });
    }
    pool.end();
  })
  .catch(err => {
    console.log('❌ Error querying championships:', err.message);
    pool.end();
  });
