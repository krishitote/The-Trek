// Quick migration runner
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    console.log('🔄 Running migration: 001_add_refresh_tokens.sql');
    
    const sql = fs.readFileSync('./migrations/001_add_refresh_tokens.sql', 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('refresh_token', 'refresh_token_expires')
    `);
    
    console.log('📋 Columns added:', result.rows);
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
