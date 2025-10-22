// backend/routes/activities.js
import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Submit new activity
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { type, distance_km, duration_min, date } = req.body;
    const userId = req.userId; // ✅ from middleware

    // ✅ validate input
    if (!type || distance_km === undefined || duration_min === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ ensure numeric types
    const distance = Number(distance_km);
    const duration = Number(duration_min);

    if (isNaN(distance) || isNaN(duration)) {
      return res.status(400).json({ message: "Distance and duration must be numbers" });
    }

    const result = await pool.query(
      `INSERT INTO activities (user_id, type, distance_km, duration_min, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, distance, duration, date || new Date()]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Activity creation failed:", err);
    res.status(500).json({ message: "Error submitting activity", error: err.message });
  }
});

// Get user activities
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
    res.status(500).json({ message: "Error fetching activities", error: err.message });
  }
});

export default router;
