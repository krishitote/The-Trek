// backend/routes/stats.js
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user's personal records
router.get('/personal-records', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const records = await pool.query(`
      SELECT 
        -- Longest distance
        (SELECT distance_km FROM activities WHERE user_id = $1 ORDER BY distance_km DESC LIMIT 1) as longest_distance,
        (SELECT date FROM activities WHERE user_id = $1 ORDER BY distance_km DESC LIMIT 1) as longest_distance_date,
        (SELECT type FROM activities WHERE user_id = $1 ORDER BY distance_km DESC LIMIT 1) as longest_distance_type,
        
        -- Fastest pace (min/km)
        (SELECT duration_min / NULLIF(distance_km, 0) FROM activities WHERE user_id = $1 AND distance_km > 0 ORDER BY (duration_min / distance_km) ASC LIMIT 1) as fastest_pace,
        (SELECT date FROM activities WHERE user_id = $1 AND distance_km > 0 ORDER BY (duration_min / distance_km) ASC LIMIT 1) as fastest_pace_date,
        
        -- Longest duration
        (SELECT duration_min FROM activities WHERE user_id = $1 ORDER BY duration_min DESC LIMIT 1) as longest_duration,
        (SELECT date FROM activities WHERE user_id = $1 ORDER BY duration_min DESC LIMIT 1) as longest_duration_date,
        
        -- Total stats
        (SELECT SUM(distance_km) FROM activities WHERE user_id = $1) as total_distance,
        (SELECT COUNT(*) FROM activities WHERE user_id = $1) as total_activities,
        (SELECT SUM(duration_min) FROM activities WHERE user_id = $1) as total_duration,
        
        -- Current streak
        (SELECT COUNT(DISTINCT DATE(date)) FROM activities WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days') as days_active_last_week
    `, [userId]);
    
    res.json(records.rows[0]);
  } catch (err) {
    console.error('Personal records fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch personal records' });
  }
});

// Get weekly progress (last 8 weeks)
router.get('/weekly-progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const progress = await pool.query(`
      SELECT 
        DATE_TRUNC('week', date) as week_start,
        SUM(distance_km) as total_distance,
        COUNT(*) as activity_count,
        SUM(duration_min) as total_duration
      FROM activities
      WHERE user_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '8 weeks'
      GROUP BY DATE_TRUNC('week', date)
      ORDER BY week_start ASC
    `, [userId]);
    
    res.json(progress.rows);
  } catch (err) {
    console.error('Weekly progress fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch weekly progress' });
  }
});

// Get monthly progress (last 6 months)
router.get('/monthly-progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const progress = await pool.query(`
      SELECT 
        DATE_TRUNC('month', date) as month_start,
        SUM(distance_km) as total_distance,
        COUNT(*) as activity_count,
        SUM(duration_min) as total_duration,
        AVG(duration_min / NULLIF(distance_km, 0)) as avg_pace
      FROM activities
      WHERE user_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month_start ASC
    `, [userId]);
    
    res.json(progress.rows);
  } catch (err) {
    console.error('Monthly progress fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch monthly progress' });
  }
});

// Get activity breakdown by type
router.get('/activity-breakdown', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const breakdown = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(distance_km) as total_distance,
        SUM(duration_min) as total_duration,
        AVG(distance_km) as avg_distance,
        AVG(duration_min / NULLIF(distance_km, 0)) as avg_pace
      FROM activities
      WHERE user_id = $1
      GROUP BY type
      ORDER BY total_distance DESC
    `, [userId]);
    
    res.json(breakdown.rows);
  } catch (err) {
    console.error('Activity breakdown fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch activity breakdown' });
  }
});

// Get daily activity calendar (last 90 days)
router.get('/activity-calendar', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const calendar = await pool.query(`
      SELECT 
        DATE(date) as activity_date,
        COUNT(*) as activity_count,
        SUM(distance_km) as total_distance
      FROM activities
      WHERE user_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY DATE(date)
      ORDER BY activity_date ASC
    `, [userId]);
    
    res.json(calendar.rows);
  } catch (err) {
    console.error('Activity calendar fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch activity calendar' });
  }
});

// Get weekly goal progress
router.get('/weekly-goal', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has a goal set
    const goalResult = await pool.query(`
      SELECT weekly_distance_goal FROM users WHERE id = $1
    `, [userId]);
    
    const goal = goalResult.rows[0]?.weekly_distance_goal || 0;
    
    // Get this week's progress
    const progressResult = await pool.query(`
      SELECT 
        COALESCE(SUM(distance_km), 0) as current_distance,
        COUNT(*) as activity_count
      FROM activities
      WHERE user_id = $1 
        AND date >= DATE_TRUNC('week', CURRENT_DATE)
        AND date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
    `, [userId]);
    
    const progress = progressResult.rows[0];
    
    res.json({
      goal: parseFloat(goal) || 0,
      current: parseFloat(progress.current_distance) || 0,
      percentage: goal > 0 ? Math.min(100, (progress.current_distance / goal * 100).toFixed(1)) : 0,
      activity_count: parseInt(progress.activity_count) || 0,
      remaining: Math.max(0, goal - progress.current_distance)
    });
  } catch (err) {
    console.error('Weekly goal fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch weekly goal' });
  }
});

// Set weekly goal
router.post('/weekly-goal', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { goal } = req.body;
    
    if (!goal || goal < 0) {
      return res.status(400).json({ error: 'Invalid goal value' });
    }
    
    await pool.query(`
      UPDATE users SET weekly_distance_goal = $1 WHERE id = $2
    `, [goal, userId]);
    
    res.json({ message: 'Goal updated successfully', goal });
  } catch (err) {
    console.error('Set weekly goal failed:', err);
    res.status(500).json({ error: 'Failed to set weekly goal' });
  }
});

export default router;
