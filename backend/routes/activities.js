// backend/routes/activities.js
import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { validateActivity } from '../middleware/validation.js';
import { activityLimiter } from '../middleware/rateLimiter.js';
import { invalidateCache } from '../middleware/cache.js';
import { checkAndAwardBadges } from './badges.js';
import { calculateCalories } from '../utils/calorieCalculator.js';

export function createActivityRouter(queryPool = pool, awardBadges = checkAndAwardBadges, clearLeaderboardCache = invalidateCache) {
const router = express.Router();

// --- Submit new activity ---
router.post("/", activityLimiter, authenticateToken, validateActivity, async (req, res) => {
  try {
    const { type, distance_km, duration_min, date, location, elevation_gain = 0 } = req.body;
    const userId = req.user.id; // ✅ from token

    // A day only has 1,440 minutes; this stops repeated maximum-size entries inflating the leaderboard.
    const dayStart = new Date(date || Date.now());
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayTotal = await queryPool.query(
      `SELECT COALESCE(SUM(duration_min), 0) AS minutes
       FROM activities WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [userId, dayStart, dayEnd]
    );
    if (Number(dayTotal.rows[0]?.minutes || 0) + Number(duration_min) > 1440) {
      return res.status(400).json({
        error: 'Invalid input',
        details: 'That would be more than 24 hours of activity logged for one day.',
      });
    }

    // Get user's weight for calorie calculation
    const userResult = await queryPool.query(
      'SELECT weight FROM users WHERE id = $1',
      [userId]
    );
    const userWeight = userResult.rows[0]?.weight || 70; // Default 70kg if not set

    // Calculate calories burned
    const caloriesBurned = calculateCalories(type, distance_km, duration_min, userWeight);

    const result = await queryPool.query(
      `INSERT INTO activities
         (user_id, type, distance_km, duration_min, date, calories_burned, location, elevation_gain)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, type, distance_km, duration_min, date || new Date(), caloriesBurned, location || null, elevation_gain]
    );

    const activity = result.rows[0];

    // Check and award badges asynchronously
    awardBadges(userId, activity.id).then(newBadges => {
      if (newBadges.length > 0) {
        console.log(`🏆 User ${userId} earned badges:`, newBadges.join(', '));
      }
    }).catch(err => console.error('Badge check error:', err));

    // Invalidate leaderboard cache when new activity added
    await clearLeaderboardCache('cache:GET:/api/leaderboards*');
    
    res.json({ ...activity, newBadges: [] }); // Will send badges via separate endpoint
  } catch (err) {
    console.error("Activity creation failed:", err.message);
    res.status(500).json({ error: "Failed to submit activity" });
  }
});

// --- Get the authenticated user's activities ---
router.get("/", authenticateToken, async (req, res) => {
  const requestedUserId = req.query.user_id;
  if (requestedUserId && String(requestedUserId) !== String(req.user.id)) {
    return res.status(403).json({ error: "You can only view your own activities" });
  }

  try {
    const result = await queryPool.query(
      "SELECT * FROM activities WHERE user_id = $1 ORDER BY date DESC",
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch activities failed:", err);
    res.status(500).json({ message: "Error fetching activities" });
  }
});

router.get("/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  if (String(userId) !== String(req.user.id)) {
    return res.status(403).json({ error: "You can only view your own activities" });
  }

  try {
    const result = await queryPool.query(
      "SELECT * FROM activities WHERE user_id = $1 ORDER BY date DESC",
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch activities failed:", err);
    res.status(500).json({ message: "Error fetching activities" });
  }
});

return router;
}

export default createActivityRouter();
