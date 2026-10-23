import express from 'express';
import pool from '../db.js';
import { cacheMiddleware } from '../middleware/cache.js';
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
          WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps')
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
          WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps')
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
          WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps')
            AND u.gender IS NOT NULL
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

  return router;
}

export default createLeaderboardRouter();