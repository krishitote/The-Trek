import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function checkTables() {
  try {
    await pool.query('SELECT COUNT(*) FROM follows');
    console.log('✅ follows table exists');
    
    await pool.query('SELECT COUNT(*) FROM activity_likes');
    console.log('✅ activity_likes table exists');
    
    await pool.query('SELECT COUNT(*) FROM activity_comments');
    console.log('✅ activity_comments table exists');
    
    console.log('✅ All social tables created successfully');
  } catch (err) {
    console.log('❌ Error:', err.message);
  } finally {
    pool.end();
  }
}

checkTables();
