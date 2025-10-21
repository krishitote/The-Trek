// backend/routes/users.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT user_id, username, email FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch users failed:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

export default router;
