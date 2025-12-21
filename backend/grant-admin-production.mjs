import pg from 'pg';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Grant Admin Privileges\n');
console.log('This script will grant admin privileges to thetrekkenya@gmail.com\n');

rl.question('Enter your PRODUCTION database URL (from Render environment): ', async (dbUrl) => {
  if (!dbUrl || dbUrl.trim() === '') {
    console.log('❌ No database URL provided');
    rl.close();
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: dbUrl.trim()
  });

  try {
    const result = await pool.query(
      'UPDATE users SET is_admin = true WHERE email = $1 RETURNING id, username, email, is_admin',
      ['thetrekkenya@gmail.com']
    );

    if (result.rows.length > 0) {
      console.log('\n✅ Admin privileges granted!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👑 User ID:', result.rows[0].id);
      console.log('👤 Username:', result.rows[0].username);
      console.log('📧 Email:', result.rows[0].email);
      console.log('🔒 Is Admin:', result.rows[0].is_admin);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n✨ You can now access the Admin Dashboard at https://trekfit.co.ke/admin');
      console.log('   Log out and log back in to see the admin button.\n');
    } else {
      console.log('❌ User not found with email: thetrekkenya@gmail.com');
      console.log('   Make sure you registered successfully.');
    }

    await pool.end();
    rl.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    rl.close();
    process.exit(1);
  }
});
