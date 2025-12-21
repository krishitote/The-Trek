import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const query = `
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('championships', 'badges', 'user_badges', 'follows', 'activity_likes', 'activity_comments')
  ORDER BY table_name
`;

pool.query(query)
  .then(res => {
    console.log('\nTables found in production database:');
    if (res.rows.length === 0) {
      console.log('❌ NONE - Migrations not applied!');
    } else {
      res.rows.forEach(r => console.log('✓', r.table_name));
    }
    pool.end();
  })
  .catch(err => {
    console.log('Error:', err.message);
    pool.end();
  });
