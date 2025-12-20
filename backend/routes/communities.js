// backend/routes/communities.js
import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import crypto from 'crypto';

const router = express.Router();

// ==================== COMMUNITY CRUD ====================

// Get all APPROVED communities + user's communities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        u.username as creator_name,
        COUNT(DISTINCT cm.user_id) as member_count,
        BOOL_OR(cm.user_id = $1) as is_member,
        MAX(CASE WHEN cm.user_id = $1 THEN cm.role END) as user_role
      FROM communities c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN community_members cm ON c.id = cm.community_id
      WHERE (c.is_approved = TRUE AND c.is_private = FALSE) 
         OR c.id IN (
        SELECT community_id FROM community_members WHERE user_id = $1
      )
      GROUP BY c.id, u.username
      ORDER BY c.created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch communities:', err);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// Get user's communities
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        cm.role,
        cm.joined_at,
        COUNT(DISTINCT cm2.user_id) as member_count
      FROM communities c
      JOIN community_members cm ON c.id = cm.community_id
      LEFT JOIN community_members cm2 ON c.id = cm2.community_id
      WHERE cm.user_id = $1
      GROUP BY c.id, cm.role, cm.joined_at
      ORDER BY cm.joined_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch user communities:', err);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// Create community
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, is_private = true } = req.body;
    const userId = req.user.id;
    
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Community name must be at least 3 characters' });
    }
    
    // Generate unique invite code
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    const result = await pool.query(`
      INSERT INTO communities (name, description, invite_code, is_private, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name.trim(), description, inviteCode, is_private, userId]);
    
    const community = result.rows[0];
    
    // Add creator as admin
    await pool.query(`
      INSERT INTO community_members (community_id, user_id, role)
      VALUES ($1, $2, 'admin')
    `, [community.id, userId]);
    
    res.json(community);
  } catch (err) {
    console.error('Failed to create community:', err);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

// Join community by invite code
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { invite_code } = req.body;
    const userId = req.user.id;
    
    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code required' });
    }
    
    // Find community
    const communityResult = await pool.query(
      'SELECT * FROM communities WHERE invite_code = $1',
      [invite_code.toUpperCase()]
    );
    
    if (communityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }
    
    const community = communityResult.rows[0];
    
    // Check if already a member
    const memberCheck = await pool.query(
      'SELECT * FROM community_members WHERE community_id = $1 AND user_id = $2',
      [community.id, userId]
    );
    
    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member of this community' });
    }
    
    // Add member
    await pool.query(
      'INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)',
      [community.id, userId, 'member']
    );
    
    res.json({ message: 'Successfully joined community', community });
  } catch (err) {
    console.error('Failed to join community:', err);
    res.status(500).json({ error: 'Failed to join community' });
  }
});

// Leave community
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;
    
    // Check if user is the creator
    const community = await pool.query(
      'SELECT created_by FROM communities WHERE id = $1',
      [communityId]
    );
    
    if (community.rows[0]?.created_by === userId) {
      return res.status(400).json({ error: 'Community creator cannot leave. Delete the community instead.' });
    }
    
    await pool.query(
      'DELETE FROM community_members WHERE community_id = $1 AND user_id = $2',
      [communityId, userId]
    );
    
    res.json({ message: 'Successfully left community' });
  } catch (err) {
    console.error('Failed to leave community:', err);
    res.status(500).json({ error: 'Failed to leave community' });
  }
});

// ==================== COMMUNITY LEADERBOARDS ====================

// Get community leaderboard
router.get('/:id/leaderboard', authenticateToken, async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;
    
    // Verify user is a member
    const memberCheck = await pool.query(
      'SELECT * FROM community_members WHERE community_id = $1 AND user_id = $2',
      [communityId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this community' });
    }
    
    // Get community members' activities
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.gender,
        COALESCE(SUM(a.distance_km), 0) as total_distance,
        COUNT(a.id) as activity_count,
        COALESCE(AVG(a.duration_min / NULLIF(a.distance_km, 0)), 0) as avg_pace,
        MAX(a.date) as last_activity_date
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      LEFT JOIN activities a ON u.id = a.user_id
      WHERE cm.community_id = $1
      GROUP BY u.id, u.username, u.gender
      ORDER BY total_distance DESC
    `, [communityId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch community leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get community members
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const communityId = req.params.id;
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.gender,
        cm.role,
        cm.joined_at
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.community_id = $1
      ORDER BY cm.joined_at ASC
    `, [communityId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

export default router;
