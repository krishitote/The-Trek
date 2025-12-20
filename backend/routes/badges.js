// backend/routes/badges.js
import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all available badges
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, icon, category, criteria, created_at
      FROM badges
      ORDER BY 
        CASE category
          WHEN 'milestones' THEN 1
          WHEN 'distance' THEN 2
          WHEN 'streaks' THEN 3
          WHEN 'performance' THEN 4
          WHEN 'variety' THEN 5
          WHEN 'special' THEN 6
        END,
        id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching badges:", err);
    res.status(500).json({ error: "Failed to fetch badges" });
  }
});

// Get user's earned badges
router.get("/earned", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.id, b.name, b.description, b.icon, b.category, b.criteria,
             ub.earned_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching user badges:", err);
    res.status(500).json({ error: "Failed to fetch earned badges" });
  }
});

// Get user's badge progress (for badges not yet earned)
router.get("/progress", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT a.id) as activity_count,
        COALESCE(SUM(a.distance_km), 0) as total_distance,
        COUNT(DISTINCT a.type) as activity_types_count,
        MIN(a.duration_min::float / NULLIF(a.distance_km, 0)) as fastest_pace,
        MAX(a.distance_km) as longest_distance,
        MAX(a.duration_min) as longest_duration,
        COUNT(DISTINCT CASE WHEN EXTRACT(DOW FROM a.date) IN (0, 6) THEN a.id END) as weekend_count
      FROM activities a
      WHERE a.user_id = $1
    `, [userId]);

    const stats = statsResult.rows[0];

    // Calculate current streak
    const streakResult = await pool.query(`
      WITH daily_activities AS (
        SELECT DISTINCT DATE(date) as activity_date
        FROM activities
        WHERE user_id = $1
        ORDER BY activity_date DESC
      ),
      streak_calc AS (
        SELECT 
          activity_date,
          activity_date - ROW_NUMBER() OVER (ORDER BY activity_date DESC)::integer as streak_group
        FROM daily_activities
      )
      SELECT COUNT(*) as current_streak
      FROM streak_calc
      WHERE streak_group = (
        SELECT streak_group
        FROM streak_calc
        ORDER BY activity_date DESC
        LIMIT 1
      )
    `, [userId]);

    const currentStreak = parseInt(streakResult.rows[0]?.current_streak || 0);

    // Get all badges with user's progress
    const badgesResult = await pool.query(`
      SELECT b.id, b.name, b.description, b.icon, b.category, b.criteria,
             ub.earned_at,
             CASE WHEN ub.id IS NOT NULL THEN true ELSE false END as earned
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
      ORDER BY 
        CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE b.category
          WHEN 'milestones' THEN 1
          WHEN 'distance' THEN 2
          WHEN 'streaks' THEN 3
          WHEN 'performance' THEN 4
          WHEN 'variety' THEN 5
          WHEN 'special' THEN 6
        END,
        b.id
    `, [userId]);

    // Calculate progress for each badge
    const badgesWithProgress = badgesResult.rows.map(badge => {
      const criteria = badge.criteria;
      let progress = 0;
      let current = 0;
      let target = criteria.value || 0;

      switch (criteria.type) {
        case 'activity_count':
          current = parseInt(stats.activity_count);
          progress = Math.min((current / target) * 100, 100);
          break;
        case 'total_distance':
          current = parseFloat(stats.total_distance);
          progress = Math.min((current / target) * 100, 100);
          break;
        case 'streak':
          current = currentStreak;
          progress = Math.min((current / target) * 100, 100);
          break;
        case 'fastest_pace':
          current = parseFloat(stats.fastest_pace || 999);
          progress = current <= target ? 100 : 0;
          break;
        case 'single_distance':
          current = parseFloat(stats.longest_distance || 0);
          progress = current >= target ? 100 : Math.min((current / target) * 100, 100);
          break;
        case 'single_duration':
          current = parseFloat(stats.longest_duration || 0);
          progress = current >= target ? 100 : Math.min((current / target) * 100, 100);
          break;
        case 'activity_types':
          current = parseInt(stats.activity_types_count);
          progress = Math.min((current / target) * 100, 100);
          break;
        case 'weekend_activities':
          current = parseInt(stats.weekend_count);
          progress = Math.min((current / target) * 100, 100);
          break;
        case 'time_of_day':
          // Special badges - checked in checkAndAwardBadges
          progress = badge.earned ? 100 : 0;
          break;
      }

      return {
        ...badge,
        progress: Math.round(progress),
        current,
        target,
      };
    });

    res.json(badgesWithProgress);
  } catch (err) {
    console.error("Error calculating badge progress:", err);
    res.status(500).json({ error: "Failed to calculate badge progress" });
  }
});

// Check and award badges for a user (called after activity submission)
export async function checkAndAwardBadges(userId, activityId) {
  try {
    // Get user stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT a.id) as activity_count,
        COALESCE(SUM(a.distance_km), 0) as total_distance,
        COUNT(DISTINCT a.type) as activity_types_count,
        MIN(a.duration_min::float / NULLIF(a.distance_km, 0)) as fastest_pace,
        MAX(a.distance_km) as longest_distance,
        MAX(a.duration_min) as longest_duration,
        COUNT(DISTINCT CASE WHEN EXTRACT(DOW FROM a.date) IN (0, 6) THEN a.id END) as weekend_count
      FROM activities a
      WHERE a.user_id = $1
    `, [userId]);

    const stats = statsResult.rows[0];

    // Calculate current streak
    const streakResult = await pool.query(`
      WITH daily_activities AS (
        SELECT DISTINCT DATE(date) as activity_date
        FROM activities
        WHERE user_id = $1
        ORDER BY activity_date DESC
      ),
      streak_calc AS (
        SELECT 
          activity_date,
          activity_date - ROW_NUMBER() OVER (ORDER BY activity_date DESC)::integer as streak_group
        FROM daily_activities
      )
      SELECT COUNT(*) as current_streak
      FROM streak_calc
      WHERE streak_group = (
        SELECT streak_group
        FROM streak_calc
        ORDER BY activity_date DESC
        LIMIT 1
      )
    `, [userId]);

    const currentStreak = parseInt(streakResult.rows[0]?.current_streak || 0);

    // Get the activity details
    const activityResult = await pool.query(`
      SELECT type, distance_km, duration_min, date
      FROM activities
      WHERE id = $1
    `, [activityId]);

    const activity = activityResult.rows[0];
    const activityHour = new Date(activity.date).getHours();
    const activityDay = new Date(activity.date).getDay();

    // Get all badges
    const badgesResult = await pool.query(`
      SELECT b.id, b.name, b.criteria
      FROM badges b
      WHERE NOT EXISTS (
        SELECT 1 FROM user_badges ub
        WHERE ub.badge_id = b.id AND ub.user_id = $1
      )
    `, [userId]);

    const newBadges = [];

    // Check each badge criteria
    for (const badge of badgesResult.rows) {
      const criteria = badge.criteria;
      let earned = false;

      switch (criteria.type) {
        case 'activity_count':
          earned = parseInt(stats.activity_count) >= criteria.value;
          break;
        case 'total_distance':
          earned = parseFloat(stats.total_distance) >= criteria.value;
          break;
        case 'streak':
          earned = currentStreak >= criteria.value;
          break;
        case 'fastest_pace':
          earned = parseFloat(stats.fastest_pace || 999) <= criteria.value;
          break;
        case 'single_distance':
          earned = parseFloat(activity.distance_km) >= criteria.value;
          break;
        case 'single_duration':
          earned = parseFloat(activity.duration_min) >= criteria.value;
          break;
        case 'activity_types':
          earned = parseInt(stats.activity_types_count) >= criteria.value;
          break;
        case 'weekend_activities':
          earned = parseInt(stats.weekend_count) >= criteria.value;
          break;
        case 'time_of_day':
          if (criteria.value === 'morning') {
            earned = activityHour < 6;
          } else if (criteria.value === 'night') {
            earned = activityHour >= 22;
          }
          break;
      }

      if (earned) {
        // Award badge
        await pool.query(`
          INSERT INTO user_badges (user_id, badge_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, badge_id) DO NOTHING
        `, [userId, badge.id]);
        newBadges.push(badge.name);
      }
    }

    return newBadges;
  } catch (err) {
    console.error("Error checking badges:", err);
    return [];
  }
}

export default router;
