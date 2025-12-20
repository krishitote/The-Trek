// backend/routes/admin.js
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import crypto from 'crypto';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ==================== COMMUNITY MANAGEMENT ====================

// Get all communities (including unapproved)
router.get('/communities', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        u.username as creator_name,
        u.email as creator_email,
        COUNT(DISTINCT cm.user_id) as member_count
      FROM communities c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN community_members cm ON c.id = cm.community_id
      GROUP BY c.id, u.username, u.email
      ORDER BY c.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch communities:', err);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// Create new community (admin only)
router.post('/communities', async (req, res) => {
  try {
    const { name, description, is_private = true, registration_fee = 0 } = req.body;
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Community name must be at least 3 characters' });
    }
    
    // Generate unique invite code
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    const result = await pool.query(`
      INSERT INTO communities (
        name, description, invite_code, is_private, 
        is_approved, created_by_admin, registration_fee, created_by
      )
      VALUES ($1, $2, $3, $4, TRUE, TRUE, $5, $6)
      RETURNING *
    `, [name.trim(), description, inviteCode, is_private, registration_fee, req.user.id]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to create community:', err);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

// Approve community
router.patch('/communities/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE communities 
      SET is_approved = TRUE 
      WHERE id = $1 
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Community not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to approve community:', err);
    res.status(500).json({ error: 'Failed to approve community' });
  }
});

// Delete community
router.delete('/communities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete members first (foreign key constraint)
    await pool.query('DELETE FROM community_members WHERE community_id = $1', [id]);
    
    // Delete community
    const result = await pool.query('DELETE FROM communities WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Community not found' });
    }
    
    res.json({ message: 'Community deleted', community: result.rows[0] });
  } catch (err) {
    console.error('Failed to delete community:', err);
    res.status(500).json({ error: 'Failed to delete community' });
  }
});

// Get community members
router.get('/communities/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        u.id, u.username, u.email, 
        cm.role, cm.joined_at
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.community_id = $1
      ORDER BY cm.joined_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// ==================== CHAMPIONSHIP MANAGEMENT ====================

// Get all championships
router.get('/championships', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ac.*,
        COUNT(DISTINCT cp.user_id) as registered_qualifiers,
        COUNT(DISTINCT ct.user_id) as total_tickets
      FROM annual_championships ac
      LEFT JOIN championship_participants cp ON ac.id = cp.championship_id
      LEFT JOIN championship_tickets ct ON ac.id = ct.championship_id
      GROUP BY ac.id
      ORDER BY ac.year DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch championships:', err);
    res.status(500).json({ error: 'Failed to fetch championships' });
  }
});

// Create new championship
router.post('/championships', async (req, res) => {
  try {
    const {
      year,
      event_date,
      registration_fee = 500,
      spectator_price = 5000,
      participant_price = 10000,
      registration_opens_at,
      qualifications_close_at
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO annual_championships (
        year, event_date, registration_fee, 
        spectator_price, participant_price,
        registration_opens_at, qualifications_close_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [year, event_date, registration_fee, spectator_price, participant_price, 
        registration_opens_at, qualifications_close_at]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to create championship:', err);
    res.status(500).json({ error: 'Failed to create championship' });
  }
});

// Toggle championship registration
router.patch('/championships/:id/toggle-registration', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE annual_championships 
      SET registration_open = NOT registration_open 
      WHERE id = $1 
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Championship not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to toggle registration:', err);
    res.status(500).json({ error: 'Failed to toggle registration' });
  }
});

// Get championship tickets/registrations
router.get('/championships/:id/tickets', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        ct.*,
        u.username, u.email
      FROM championship_tickets ct
      JOIN users u ON ct.user_id = u.id
      WHERE ct.championship_id = $1
      ORDER BY ct.created_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Manually generate codes for top 10 qualifiers
router.post('/championships/:id/generate-qualifier-codes', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get top 10 per gender
    const qualifiers = await pool.query(`
      SELECT 
        u.id as user_id,
        u.gender,
        SUM(a.distance_km) as total_distance_km,
        ROW_NUMBER() OVER (PARTITION BY u.gender ORDER BY SUM(a.distance_km) DESC) as rank
      FROM users u
      JOIN activities a ON u.id = a.user_id
      WHERE u.gender IN ('male', 'female')
      GROUP BY u.id, u.gender
      HAVING SUM(a.distance_km) > 0
      ORDER BY u.gender, total_distance_km DESC
    `);
    
    const top10 = qualifiers.rows.filter(q => q.rank <= 10);
    
    // Generate tickets with codes
    const codes = [];
    for (const qualifier of top10) {
      const code = `GF-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      
      // Insert or update ticket
      await pool.query(`
        INSERT INTO championship_tickets (
          championship_id, user_id, ticket_type, price, 
          payment_status, participant_code
        )
        VALUES ($1, $2, 'qualifier', 0, 'paid', $3)
        ON CONFLICT (championship_id, user_id) 
        DO UPDATE SET participant_code = $3
      `, [id, qualifier.user_id, code]);
      
      codes.push({ user_id: qualifier.user_id, code });
    }
    
    res.json({ message: `Generated codes for ${codes.length} qualifiers`, codes });
  } catch (err) {
    console.error('Failed to generate codes:', err);
    res.status(500).json({ error: 'Failed to generate qualifier codes' });
  }
});

// ==================== USER MANAGEMENT ====================

// Get all users with admin flag
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.is_admin,
        u.created_at,
        COUNT(DISTINCT a.id) as activity_count,
        COALESCE(SUM(a.distance_km), 0) as total_distance
      FROM users u
      LEFT JOIN activities a ON u.id = a.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Make user admin
router.patch('/users/:id/make-admin', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE users 
      SET is_admin = TRUE 
      WHERE id = $1 
      RETURNING id, username, email, is_admin
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to make user admin:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
