// backend/db.js
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // Connection pool settings for production
  max: 20,                    // Maximum connections (Neon free tier: 20)
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast if can't connect
  
  // SSL for Neon (required in production)
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('❌ Unexpected database error:', err.message);
});

// Log pool activity in development
if (process.env.NODE_ENV !== 'production') {
  pool.on('connect', () => {
    console.log('🔌 New database client connected');
  });
  
  pool.on('remove', () => {
    console.log('🔌 Database client removed from pool');
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

export default pool;