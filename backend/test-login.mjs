#!/usr/bin/env node
// Test login functionality
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('Testing login functionality...\n');

const testUsername = 'Admin';
const testPassword = 'AdminPass123!';

try {
  // Fetch user
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [testUsername]);
  
  if (result.rows.length === 0) {
    console.log('❌ User not found in database');
    console.log('   Username searched:', testUsername);
  } else {
    const user = result.rows[0];
    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   Is Admin:', user.is_admin);
    
    // Test password
    const passwordMatch = await bcrypt.compare(testPassword, user.password);
    
    if (passwordMatch) {
      console.log('\n✅ Password is CORRECT');
      console.log('   Login should work with:');
      console.log('   Username:', testUsername);
      console.log('   Password:', testPassword);
    } else {
      console.log('\n❌ Password is INCORRECT');
      console.log('   The stored password hash does not match');
      console.log('   You may need to reset the password');
    }
  }
  
  // List all users for debugging
  console.log('\n--- All users in database ---');
  const allUsers = await pool.query('SELECT id, username, email, is_admin FROM users ORDER BY id');
  allUsers.rows.forEach(u => {
    console.log(`  ${u.id}: ${u.username} (${u.email}) - Admin: ${u.is_admin}`);
  });
  
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await pool.end();
}
