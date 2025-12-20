// backend/middleware/adminMiddleware.js
import pool from '../db.js';

/**
 * Middleware to check if user is an admin
 * Must be used AFTER authenticateToken middleware
 */
export async function requireAdmin(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    const result = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!result.rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('Admin check failed:', err);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
}
