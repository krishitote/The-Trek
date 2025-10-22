// backend/routes/users.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log("📡 Fetching users...");
    const result = await pool.query("SELECT user_id, username, email FROM users");
    console.log("✅ Users fetched:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch users failed:", err.message);
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
});

export default router;
