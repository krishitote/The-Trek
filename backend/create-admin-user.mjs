import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const username = 'Admin';
const email = 'thetrekkenya@gmail.com';
const password = 'AdminPass123!'; // Change this to your desired password

console.log('\n🔐 Creating admin account...\n');

bcrypt.hash(password, 10)
  .then(hashedPassword => {
    return pool.query(
      `INSERT INTO users (username, email, password, is_admin, created_at) 
       VALUES ($1, $2, $3, true, NOW()) 
       RETURNING id, username, email, is_admin`,
      [username, email, hashedPassword]
    );
  })
  .then(res => {
    console.log('✅ Admin account created successfully!\n');
    console.log('👑 Username:', res.rows[0].username);
    console.log('📧 Email:', res.rows[0].email);
    console.log('🔒 Is Admin:', res.rows[0].is_admin);
    console.log('🆔 User ID:', res.rows[0].id);
    console.log('\n🌐 Login at: https://trekfit.co.ke/login');
    console.log('📝 Username:', username);
    console.log('🔑 Password:', password);
    console.log('\n⚠️  Remember to change your password after first login!\n');
    pool.end();
  })
  .catch(err => {
    if (err.code === '23505') {
      console.log('❌ User already exists (duplicate username or email)');
    } else {
      console.log('❌ Error:', err.message);
    }
    pool.end();
  });
