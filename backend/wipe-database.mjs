import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function wipeDatabase() {
  try {
    console.log('🗑️  WIPING ALL DATA FROM DATABASE...\n');
    
    // Delete all data from tables (in correct order to respect foreign keys)
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
    
    // Reset sequences to start from 1
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE activities_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE communities_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE championships_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE badges_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE user_badges_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE community_members_id_seq RESTART WITH 1');
    console.log('✅ Reset all ID sequences\n');
    
    console.log('✨ DATABASE COMPLETELY WIPED!');
    console.log('\n📝 Next Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to https://trekfit.co.ke/register');
    console.log('2. Register with:');
    console.log('   Username: Admin');
    console.log('   Email: thetrekkenya@gmail.com');
    console.log('   Password: AdminPass123!');
    console.log('   (Fill in other required fields)');
    console.log('\n3. After registration, run this command to grant admin privileges:');
    console.log('   node grant-admin.mjs thetrekkenya@gmail.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

wipeDatabase();
