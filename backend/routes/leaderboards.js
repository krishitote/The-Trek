import express from 'express';
import pool from '../db.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
export function createLeaderboardRouter(queryPool = pool, cacheFactory = cacheMiddleware) {
  const router = express.Router();

  router.get('/quick', cacheFactory({ ttl: 300 }), async (req, res) => {
    try {
      const result = await queryPool.query(`
        SELECT u.id, u.username,
               COALESCE(SUM(a.distance_km), 0) AS total_distance,
               COUNT(a.id) AS activity_count,
               COALESCE(AVG(a.duration_min / NULLIF(a.distance_km, 0)), 0) AS avg_pace
        FROM users u
        LEFT JOIN activities a ON u.id = a.user_id
        WHERE u.show_on_leaderboard = TRUE
        GROUP BY u.id, u.username
        ORDER BY total_distance DESC
      `);

      res.json(result.rows);
    } catch (err) {
      console.error('Quick leaderboard failed:', err);
      res.status(500).json({ error: 'Failed to fetch rankings' });
    }
  });

  router.get('/', cacheFactory({ ttl: 600 }), async (req, res) => {
    try {
      const [allTime, perActivity, perGender] = await Promise.all([
        queryPool.query(`
          SELECT u.id AS user_id, u.username, u.gender,
                 SUM(a.distance_km) AS total_distance,
                 COUNT(a.id) AS activity_count,
                 AVG(a.duration_min / NULLIF(a.distance_km, 0)) AS avg_pace
          FROM activities a
          JOIN users u ON a.user_id = u.id
          WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps','Hiking')
            AND u.show_on_leaderboard = TRUE
          GROUP BY u.id, u.username, u.gender
          ORDER BY total_distance DESC
          LIMIT 10
        `),
        queryPool.query(`
          SELECT a.type, u.id AS user_id, u.username, u.gender,
                 SUM(a.distance_km) AS total_distance,
                 COUNT(a.id) AS activity_count,
                 AVG(a.duration_min / NULLIF(a.distance_km, 0)) AS avg_pace
          FROM activities a
          JOIN users u ON a.user_id = u.id
          WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps','Hiking')
            AND u.show_on_leaderboard = TRUE
          GROUP BY a.type, u.id, u.username, u.gender
          ORDER BY a.type, total_distance DESC
        `),
        queryPool.query(`
          SELECT LOWER(u.gender) AS gender, u.id AS user_id, u.username,
                 SUM(a.distance_km) AS total_distance,
                 COUNT(a.id) AS activity_count,
                 AVG(a.duration_min / NULLIF(a.distance_km, 0)) AS avg_pace
          FROM activities a
          JOIN users u ON a.user_id = u.id
          WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps','Hiking')
            AND LOWER(u.gender) IN ('male','female')
            AND u.show_on_leaderboard = TRUE
          GROUP BY u.gender, u.id, u.username
          ORDER BY u.gender, total_distance DESC
        `),
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

  // Own stats work whether or not the user opted in; rank only exists among opted-in users.
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      const result = await queryPool.query(`
        WITH totals AS (
          SELECT u.id, u.show_on_leaderboard,
                 COALESCE(SUM(a.distance_km), 0) AS total_distance
          FROM users u
          LEFT JOIN activities a ON a.user_id = u.id
          GROUP BY u.id, u.show_on_leaderboard
        ), ranked AS (
          SELECT id, RANK() OVER (ORDER BY total_distance DESC) AS rank
          FROM totals
          WHERE show_on_leaderboard = TRUE
        )
        SELECT t.total_distance, t.show_on_leaderboard, r.rank,
               (SELECT COUNT(*) FROM totals WHERE show_on_leaderboard = TRUE) AS total_users
        FROM totals t
        LEFT JOIN ranked r ON r.id = t.id
        WHERE t.id = $1
      `, [req.user.id]);

      if (!result.rows.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      const row = result.rows[0];
      res.json({
        totalDistance: Number(row.total_distance),
        showOnLeaderboard: row.show_on_leaderboard,
        rank: row.rank === null ? null : Number(row.rank),
        totalUsers: Number(row.total_users),
      });
    } catch (err) {
      console.error('Own leaderboard stats failed:', err);
      res.status(500).json({ error: 'Failed to fetch your stats' });
    }
  });

  return router;
}

export default createLeaderboardRouter();