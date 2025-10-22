// backend/routes/activities.js
import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Submit new activity ---
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { type, distance_km, duration_min, date } = req.body;
    const userId = req.user.id; // ✅ from token

    if (!type || !distance_km || !duration_min) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO activities (user_id, type, distance_km, duration_min, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, distance_km, duration_min, date || new Date()]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Activity creation failed:", err);
    res.status(500).json({ message: "Error submitting activity" });
  }
});

// --- Get activities by user ---
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM activities WHERE user_id = $1 ORDER BY date DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch activities failed:", err);
    res.status(500).json({ message: "Error fetching activities" });
  }
});

export default router;
