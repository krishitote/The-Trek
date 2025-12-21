import dotenv from 'dotenv';
import pg from 'pg';
import bcryptjs from 'bcryptjs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function clearAndSeed() {
  try {
    console.log('🗑️  Clearing database...\n');
    
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
    
    // Reset sequences
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE activities_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE communities_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE championships_id_seq RESTART WITH 1');
    console.log('✅ Reset ID sequences\n');
    
    console.log('👤 Creating fresh users...\n');
    
    // Create Admin user
    const adminPassword = await bcryptjs.hash('AdminPass123!', 10);
    const adminResult = await pool.query(
      `INSERT INTO users (username, email, password, is_admin, weight, height, gender, first_name, last_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, username, email, is_admin`,
      ['Admin', 'thetrekkenya@gmail.com', adminPassword, true, 75, 175, 'male', 'Admin', 'User']
    );
    console.log('👑 Admin created:', adminResult.rows[0]);
    console.log('   Password: AdminPass123!\n');
    
    // Create test users
    const testUsers = [
      { username: 'JohnRunner', email: 'john@example.com', password: 'Test123!', weight: 80, height: 180, gender: 'male', firstName: 'John', lastName: 'Doe' },
      { username: 'SarahCyclist', email: 'sarah@example.com', password: 'Test123!', weight: 65, height: 168, gender: 'female', firstName: 'Sarah', lastName: 'Smith' },
      { username: 'MikeSwimmer', email: 'mike@example.com', password: 'Test123!', weight: 75, height: 175, gender: 'male', firstName: 'Mike', lastName: 'Johnson' },
      { username: 'EmilyHiker', email: 'emily@example.com', password: 'Test123!', weight: 60, height: 165, gender: 'female', firstName: 'Emily', lastName: 'Brown' }
    ];
    
    for (const user of testUsers) {
      const hashedPassword = await bcryptjs.hash(user.password, 10);
      const result = await pool.query(
        `INSERT INTO users (username, email, password, is_admin, weight, height, gender, first_name, last_name) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING id, username, email`,
        [user.username, user.email, hashedPassword, false, user.weight, user.height, user.gender, user.firstName, user.lastName]
      );
      console.log('👤 User created:', result.rows[0]);
    }
    
    console.log('\n✨ Database cleared and seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 ADMIN:');
    console.log('   Username: Admin');
    console.log('   Email: thetrekkenya@gmail.com');
    console.log('   Password: AdminPass123!');
    console.log('\n👥 TEST USERS (all use password: Test123!):');
    console.log('   - JohnRunner (john@example.com)');
    console.log('   - SarahCyclist (sarah@example.com)');
    console.log('   - MikeSwimmer (mike@example.com)');
    console.log('   - EmilyHiker (emily@example.com)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

clearAndSeed();
