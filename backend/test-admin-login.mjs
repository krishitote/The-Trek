import dotenv from 'dotenv';
import pg from 'pg';
import bcryptjs from 'bcryptjs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testLogin() {
  try {
    // Test password: AdminPass123!
    const testPassword = 'AdminPass123!';
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, username, email, password, is_admin FROM users WHERE username = $1',
      ['Admin']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      await pool.end();
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:', {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin
    });
    console.log('🔐 Password hash in DB:', user.password);
    
    // Test password match
    const isMatch = await bcryptjs.compare(testPassword, user.password);
    console.log(`\n🔑 Testing password "${testPassword}"`);
    console.log(isMatch ? '✅ Password matches!' : '❌ Password does NOT match');
    
    if (!isMatch) {
      console.log('\n🔧 Creating new hash to compare:');
      const newHash = await bcryptjs.hash(testPassword, 10);
      console.log('New hash:', newHash);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

testLogin();
