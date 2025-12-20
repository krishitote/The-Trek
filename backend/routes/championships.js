// backend/routes/championships.js
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current championship info
router.get('/current', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM annual_championships
      WHERE year = EXTRACT(YEAR FROM NOW())
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active championship' });
    }
    
    const championship = result.rows[0];
    
    // Get contribution stats
    const contributions = await pool.query(`
      SELECT 
        COUNT(*) as contributor_count,
        COALESCE(SUM(amount), 0) as total_contributions
      FROM contributions
      WHERE championship_id = $1
    `, [championship.id]);
    
    res.json({
      ...championship,
      contributor_count: contributions.rows[0].contributor_count,
      total_contributions: contributions.rows[0].total_contributions
    });
  } catch (err) {
    console.error('Failed to fetch championship:', err);
    res.status(500).json({ error: 'Failed to fetch championship' });
  }
});

// Get top 10 qualifiers per gender
router.get('/qualifiers', async (req, res) => {
  try {
    const maleResult = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.gender,
        COALESCE(SUM(a.distance_km), 0) as total_distance,
        COUNT(a.id) as activity_count,
        cp.payment_status,
        cp.rank_at_registration
      FROM users u
      LEFT JOIN activities a ON u.id = a.user_id 
        AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM NOW())
      LEFT JOIN championship_participants cp ON u.id = cp.user_id
        AND cp.championship_id = (SELECT id FROM annual_championships WHERE year = EXTRACT(YEAR FROM NOW()) LIMIT 1)
      WHERE u.gender = 'male'
      GROUP BY u.id, u.username, u.gender, cp.payment_status, cp.rank_at_registration
      ORDER BY total_distance DESC
      LIMIT 10
    `);
    
    const femaleResult = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.gender,
        COALESCE(SUM(a.distance_km), 0) as total_distance,
        COUNT(a.id) as activity_count,
        cp.payment_status,
        cp.rank_at_registration
      FROM users u
      LEFT JOIN activities a ON u.id = a.user_id 
        AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM NOW())
      LEFT JOIN championship_participants cp ON u.id = cp.user_id
        AND cp.championship_id = (SELECT id FROM annual_championships WHERE year = EXTRACT(YEAR FROM NOW()) LIMIT 1)
      WHERE u.gender = 'female'
      GROUP BY u.id, u.username, u.gender, cp.payment_status, cp.rank_at_registration
      ORDER BY total_distance DESC
      LIMIT 10
    `);
    
    res.json({
      male: maleResult.rows,
      female: femaleResult.rows
    });
  } catch (err) {
    console.error('Failed to fetch qualifiers:', err);
    res.status(500).json({ error: 'Failed to fetch qualifiers' });
  }
});

// Register for championship (pay registration fee)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { payment_method, transaction_ref } = req.body;
    
    // Get current championship
    const championship = await pool.query(`
      SELECT * FROM annual_championships
      WHERE year = EXTRACT(YEAR FROM NOW())
      LIMIT 1
    `);
    
    if (championship.rows.length === 0) {
      return res.status(404).json({ error: 'No active championship' });
    }
    
    const champ = championship.rows[0];
    
    // Check if user is in top 10
    const userStats = await pool.query(`
      SELECT 
        u.gender,
        COALESCE(SUM(a.distance_km), 0) as total_distance,
        ROW_NUMBER() OVER (PARTITION BY u.gender ORDER BY COALESCE(SUM(a.distance_km), 0) DESC) as rank
      FROM users u
      LEFT JOIN activities a ON u.id = a.user_id 
        AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM NOW())
      WHERE u.id = $1
      GROUP BY u.id, u.gender
    `, [userId]);
    
    if (userStats.rows.length === 0 || userStats.rows[0].rank > 10) {
      return res.status(403).json({ error: 'Only top 10 per gender can register' });
    }
    
    const { gender, total_distance, rank } = userStats.rows[0];
    
    // Check if already registered
    const existingReg = await pool.query(
      'SELECT * FROM championship_participants WHERE championship_id = $1 AND user_id = $2',
      [champ.id, userId]
    );
    
    if (existingReg.rows.length > 0) {
      return res.status(400).json({ error: 'Already registered for championship' });
    }
    
    // Register participant (pending payment verification)
    await pool.query(`
      INSERT INTO championship_participants 
        (championship_id, user_id, gender, rank_at_registration, total_distance, payment_amount, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    `, [champ.id, userId, gender, rank, total_distance, champ.registration_fee]);
    
    // Record contribution
    await pool.query(`
      INSERT INTO contributions 
        (championship_id, user_id, amount, purpose, payment_method, transaction_ref, status)
      VALUES ($1, $2, $3, 'registration', $4, $5, 'pending')
    `, [champ.id, userId, champ.registration_fee, payment_method, transaction_ref]);
    
    res.json({ 
      message: 'Registration submitted. Payment verification pending.',
      amount: champ.registration_fee
    });
  } catch (err) {
    console.error('Championship registration failed:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Contribute to prize pool (anyone can contribute)
router.post('/contribute', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, payment_method, transaction_ref } = req.body;
    
    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Minimum contribution is 100' });
    }
    
    // Get current championship
    const championship = await pool.query(`
      SELECT * FROM annual_championships
      WHERE year = EXTRACT(YEAR FROM NOW())
      LIMIT 1
    `);
    
    if (championship.rows.length === 0) {
      return res.status(404).json({ error: 'No active championship' });
    }
    
    const champ = championship.rows[0];
    
    // Record contribution
    await pool.query(`
      INSERT INTO contributions 
        (championship_id, user_id, amount, purpose, payment_method, transaction_ref, status)
      VALUES ($1, $2, $3, 'prize_pool', $4, $5, 'completed')
    `, [champ.id, userId, amount, payment_method, transaction_ref]);
    
    // Update prize pool
    await pool.query(
      'UPDATE annual_championships SET prize_pool = prize_pool + $1 WHERE id = $2',
      [amount, champ.id]
    );
    
    res.json({ message: 'Thank you for your contribution!', amount });
  } catch (err) {
    console.error('Contribution failed:', err);
    res.status(500).json({ error: 'Contribution failed' });
  }
});

// Get user's championship status
router.get('/my-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current rank
    const rankResult = await pool.query(`
      WITH ranked_users AS (
        SELECT 
          u.id,
          u.gender,
          COALESCE(SUM(a.distance_km), 0) as total_distance,
          ROW_NUMBER() OVER (PARTITION BY u.gender ORDER BY COALESCE(SUM(a.distance_km), 0) DESC) as rank
        FROM users u
        LEFT JOIN activities a ON u.id = a.user_id 
          AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM NOW())
        GROUP BY u.id, u.gender
      )
      SELECT * FROM ranked_users WHERE id = $1
    `, [userId]);
    
    if (rankResult.rows.length === 0) {
      return res.json({ qualified: false, rank: null });
    }
    
    const { rank, total_distance, gender } = rankResult.rows[0];
    const qualified = rank <= 10;
    
    // Check registration status
    const regResult = await pool.query(`
      SELECT cp.*, ac.registration_fee, ac.finale_date, ac.finale_location
      FROM championship_participants cp
      JOIN annual_championships ac ON cp.championship_id = ac.id
      WHERE cp.user_id = $1 AND ac.year = EXTRACT(YEAR FROM NOW())
    `, [userId]);
    
    res.json({
      qualified,
      rank,
      gender,
      total_distance,
      registered: regResult.rows.length > 0,
      registration: regResult.rows[0] || null
    });
  } catch (err) {
    console.error('Failed to fetch status:', err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
