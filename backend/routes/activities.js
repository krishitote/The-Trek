// backend/routes/activities.js
import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { validateActivity } from '../middleware/validation.js';
import { activityLimiter } from '../middleware/rateLimiter.js';
import { invalidateCache } from '../middleware/cache.js';
import { checkAndAwardBadges } from './badges.js';
import { calculateCalories } from '../utils/calorieCalculator.js';

const router = express.Router();

// --- Submit new activity ---
router.post("/", activityLimiter, authenticateToken, validateActivity, async (req, res) => {
  try {
    const { type, distance_km, duration_min, date } = req.body;
    const userId = req.user.id; // ✅ from token

    // Get user's weight for calorie calculation
    const userResult = await pool.query(
      'SELECT weight FROM users WHERE id = $1',
      [userId]
    );
    const userWeight = userResult.rows[0]?.weight || 70; // Default 70kg if not set

    // Calculate calories burned
    const caloriesBurned = calculateCalories(type, distance_km, duration_min, userWeight);

    const result = await pool.query(
      `INSERT INTO activities (user_id, type, distance_km, duration_min, date, calories_burned)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, distance_km, duration_min, date || new Date(), caloriesBurned]
    );

    const activity = result.rows[0];

    // Check and award badges asynchronously
    checkAndAwardBadges(userId, activity.id).then(newBadges => {
      if (newBadges.length > 0) {
        console.log(`🏆 User ${userId} earned badges:`, newBadges.join(', '));
      }
    }).catch(err => console.error('Badge check error:', err));

    // Invalidate leaderboard cache when new activity added
    await invalidateCache('cache:GET:/api/leaderboards*');
    
    res.json({ ...activity, newBadges: [] }); // Will send badges via separate endpoint
  } catch (err) {
    console.error("Activity creation failed:", err.message);
    res.status(500).json({ error: err.message });
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
