// backend/test-db.mjs
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Create a new pool using DATABASE_URL from .env
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const { rows } = await pool.query("SELECT NOW() AS current_time");
    console.log("✅ Database connected! Current time:", rows[0].current_time);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  } finally {
    await pool.end();
  }
}

testConnection();
