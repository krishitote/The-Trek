import express from 'express';
import pool from '../db.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

// Starting weights: raw km is not comparable across sports, so overall ranking uses points.
export const POINTS_PER_KM = { Running: 1, Walking: 0.7, Hiking: 1, Cycling: 0.3, Swimming: 4, Steps: 0.7 };
const PERIOD_DAYS = { week: 7, month: 30, all: null };
const DEFAULT_PERIOD = 'week';
const TOP_N = 10;

// Built only from the constants above, never from request input.
const TYPE_LIST = Object.keys(POINTS_PER_KM).map((type) => `'${type}'`).join(',');
const POINTS_SQL = `(a.distance_km * CASE a.type ${Object.entries(POINTS_PER_KM)
  .map(([type, weight]) => `WHEN '${type}' THEN ${weight}`)
  .join(' ')} ELSE 0 END + COALESCE(a.elevation_gain, 0) * 0.01)`;

function parsePeriod(raw) {
  const key = raw === undefined ? DEFAULT_PERIOD : String(raw);
  return Object.hasOwn(PERIOD_DAYS, key) ? key : null;
}

function periodClause(period) {
  const days = PERIOD_DAYS[period];
  return days ? `AND a.date >= NOW() - INTERVAL '${days} days'` : '';
}

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

  // Ties go to whoever reached the total first (earliest latest-activity).
  router.get('/', cacheFactory({ ttl: 600 }), async (req, res) => {
    const period = parsePeriod(req.query.period);
    if (!period) {
      return res.status(400).json({ error: 'period must be week, month or all' });
    }
    const since = periodClause(period);

    try {
      const [overall, perActivity, perGender] = await Promise.all([
        queryPool.query(`
          SELECT u.id AS user_id, u.username,
                 SUM(a.distance_km) AS total_distance,
                 COUNT(a.id) AS activity_count,
                 SUM(${POINTS_SQL}) AS points
          FROM activities a
          JOIN users u ON a.user_id = u.id
          WHERE a.type IN (${TYPE_LIST})
            AND u.show_on_leaderboard = TRUE
            ${since}
          GROUP BY u.id, u.username
          ORDER BY points DESC, MAX(a.date) ASC, u.id
          LIMIT ${TOP_N}
        `),
        queryPool.query(`
          SELECT type, user_id, username, total_distance, activity_count, board_position
          FROM (
            SELECT a.type, u.id AS user_id, u.username,
                   SUM(a.distance_km) AS total_distance,
                   COUNT(a.id) AS activity_count,
                   ROW_NUMBER() OVER (
                     PARTITION BY a.type
                     ORDER BY SUM(a.distance_km) DESC, MAX(a.date) ASC, u.id
                   ) AS board_position
            FROM activities a
            JOIN users u ON a.user_id = u.id
            WHERE a.type IN (${TYPE_LIST})
              AND u.show_on_leaderboard = TRUE
              ${since}
            GROUP BY a.type, u.id, u.username
          ) ranked
          WHERE board_position <= ${TOP_N}
          ORDER BY type, board_position
        `),
        queryPool.query(`
          SELECT gender, user_id, username, total_distance, activity_count, points, board_position
          FROM (
            SELECT LOWER(u.gender) AS gender, u.id AS user_id, u.username,
                   SUM(a.distance_km) AS total_distance,
                   COUNT(a.id) AS activity_count,
                   SUM(${POINTS_SQL}) AS points,
                   ROW_NUMBER() OVER (
                     PARTITION BY LOWER(u.gender)
                     ORDER BY SUM(${POINTS_SQL}) DESC, MAX(a.date) ASC, u.id
                   ) AS board_position
            FROM activities a
            JOIN users u ON a.user_id = u.id
            WHERE a.type IN (${TYPE_LIST})
              AND LOWER(u.gender) IN ('male','female')
              AND u.show_on_leaderboard = TRUE
              ${since}
            GROUP BY LOWER(u.gender), u.id, u.username
          ) ranked
          WHERE board_position <= ${TOP_N}
          ORDER BY gender, board_position
        `),
      ]);

      res.json({
        period,
        allTimeLeaders: overall.rows,
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
    const period = parsePeriod(req.query.period);
    if (!period) {
      return res.status(400).json({ error: 'period must be week, month or all' });
    }

    try {
      const result = await queryPool.query(`
        WITH totals AS (
          SELECT u.id, u.show_on_leaderboard,
                 COALESCE(SUM(a.distance_km), 0) AS total_distance
          FROM users u
          LEFT JOIN activities a ON a.user_id = u.id
          GROUP BY u.id, u.show_on_leaderboard
        ), scores AS (
          SELECT a.user_id AS id, SUM(${POINTS_SQL}) AS points
          FROM activities a
          JOIN users u ON u.id = a.user_id
          WHERE a.type IN (${TYPE_LIST})
            AND u.show_on_leaderboard = TRUE
            ${periodClause(period)}
          GROUP BY a.user_id
        ), ranked AS (
          SELECT id, RANK() OVER (ORDER BY points DESC) AS rank
          FROM scores
        )
        SELECT t.total_distance, t.show_on_leaderboard, r.rank,
               (SELECT COUNT(*) FROM scores) AS total_users
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
