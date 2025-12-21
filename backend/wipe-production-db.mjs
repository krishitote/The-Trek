import pg from 'pg';

// PRODUCTION Neon Database URL
const PRODUCTION_DATABASE_URL = 'postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require';

console.log('⚠️  WARNING: This will wipe the PRODUCTION database!');
console.log('⚠️  Please provide the correct Neon PostgreSQL connection string.\n');
console.log('To get your production database URL:');
console.log('1. Go to https://dashboard.render.com');
console.log('2. Open your backend service (the-trek)');
console.log('3. Go to Environment tab');
console.log('4. Copy the DATABASE_URL value');
console.log('\nThen update this file with the correct URL and run it again.\n');

const { Pool } = pg;

async function wipeProductionDatabase() {
  // Prevent accidental execution without updating the URL
  if (PRODUCTION_DATABASE_URL.includes('xxxxxxxxxxxx')) {
    console.log('❌ Please update the DATABASE_URL in this file first!');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: PRODUCTION_DATABASE_URL
  });

  try {
    console.log('🗑️  WIPING PRODUCTION DATABASE...\n');
    
    await pool.query('DELETE FROM user_badges');
    console.log('✅ Cleared user_badges');
    
    await pool.query('DELETE FROM activities');
    console.log('✅ Cleared activities');
    
    await pool.query('DELETE FROM community_members');
    console.log('✅ Cleared community_members');
    
    await pool.query('DELETE FROM communities');
    console.log('✅ Cleared communities');
    
    await pool.query('DELETE FROM championships');
    console.log('✅ Cleared championships');
    
    await pool.query('DELETE FROM users');
    console.log('✅ Cleared users');
    
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE activities_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE communities_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE championships_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE badges_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE user_badges_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE community_members_id_seq RESTART WITH 1');
    console.log('✅ Reset all sequences\n');
    
    console.log('✨ PRODUCTION DATABASE WIPED!\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

wipeProductionDatabase();
