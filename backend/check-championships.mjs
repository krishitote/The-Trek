import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

console.log('Checking championships...\n');

// Check both possible table names
Promise.all([
  pool.query("SELECT * FROM championships ORDER BY created_at DESC LIMIT 5").catch(e => ({ error: e.message, table: 'championships' })),
  pool.query("SELECT * FROM annual_championships ORDER BY created_at DESC LIMIT 5").catch(e => ({ error: e.message, table: 'annual_championships' }))
]).then(([champRes, annualRes]) => {
  console.log('=== CHAMPIONSHIPS TABLE ===');
  if (champRes.error) {
    console.log(`❌ Error: ${champRes.error}`);
  } else if (champRes.rows.length === 0) {
    console.log('⚠️  Table exists but is EMPTY');
  } else {
    console.log('✅ Found championships:');
    champRes.rows.forEach(c => {
      console.log(`- ${c.title || c.name} (${c.start_date} to ${c.end_date})`);
    });
  }
  
  console.log('\n=== ANNUAL_CHAMPIONSHIPS TABLE ===');
  if (annualRes.error) {
    console.log(`❌ Error: ${annualRes.error}`);
  } else if (annualRes.rows.length === 0) {
    console.log('⚠️  Table exists but is EMPTY');
  } else {
    console.log('✅ Found annual championships:');
    annualRes.rows.forEach(c => {
      console.log(`- Year ${c.year} (${c.start_date} to ${c.end_date}) - Open: ${c.registration_open}`);
    });
  }
  
  pool.end();
}).catch(err => {
  console.log('❌ Unexpected error:', err.message);
  pool.end();
});
