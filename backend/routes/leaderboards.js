import express from 'express';
import pool from '../db.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// FAST endpoint for dashboard ranking (cached for 5 minutes)
router.get('/quick', cacheMiddleware({ ttl: 300 }), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.profile_image,
        COALESCE(SUM(a.distance_km), 0) as total_distance,
        COUNT(a.id) as activity_count,
        COALESCE(AVG(a.duration_min / NULLIF(a.distance_km, 0)), 0) as avg_pace
      FROM users u
      LEFT JOIN activities a ON u.id = a.user_id
      GROUP BY u.id, u.username, u.profile_image
      ORDER BY total_distance DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Quick leaderboard failed:', err);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

// Full leaderboard with all breakdowns (cached for 10 minutes)
router.get('/', cacheMiddleware({ ttl: 600 }), async (req, res) => {
  try {
    const [allTime, perActivity, perGender] = await Promise.all([
      pool.query(`
        SELECT u.id as user_id, u.username, u.gender,
               SUM(a.distance_km) AS total_distance,
               COUNT(a.id) as activity_count,
               AVG(a.duration_min / NULLIF(a.distance_km,0)) AS avg_pace
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps')
        GROUP BY u.id, u.username, u.gender
        ORDER BY total_distance DESC
        LIMIT 10
      `),
      
      pool.query(`
        SELECT a.type, u.id as user_id, u.username, u.gender,
               SUM(a.distance_km) AS total_distance,
               AVG(a.duration_min / NULLIF(a.distance_km,0)) AS avg_pace
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps')
        GROUP BY a.type, u.id, u.username, u.gender
        ORDER BY a.type, total_distance DESC
      `),
      
      pool.query(`
        SELECT u.gender, u.id as user_id, u.username,
               SUM(a.distance_km) AS total_distance,
               AVG(a.duration_min / NULLIF(a.distance_km,0)) AS avg_pace
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps')
          AND u.gender IS NOT NULL
        GROUP BY u.gender, u.id, u.username
        ORDER BY u.gender, total_distance DESC
      `)
    ]);

    res.json({
      allTimeLeaders: allTime.rows,
      perActivity: perActivity.rows,
      perGender: perGender.rows,
    });
  } catch (err) {
    console.error('Leaderboard fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboards' });
  }
});

export default router;