// backend/routes/social.js
import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==================== FOLLOWS ====================

// Follow a user
router.post("/follow/:userId", authenticateToken, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId);

    if (followerId === followingId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [followerId, followingId]
    );

    res.json({ message: "Followed successfully" });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Unfollow a user
router.delete("/follow/:userId", authenticateToken, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId);

    await pool.query(
      `DELETE FROM follows
       WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    );

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// Get user's followers
router.get("/followers/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const result = await pool.query(
      `SELECT u.id, u.username, u.profile_image, u.follower_count, u.following_count,
              f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get followers error:", err);
    res.status(500).json({ error: "Failed to get followers" });
  }
});

// Get user's following
router.get("/following/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const result = await pool.query(
      `SELECT u.id, u.username, u.profile_image, u.follower_count, u.following_count,
              f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get following error:", err);
    res.status(500).json({ error: "Failed to get following" });
  }
});

// Check if current user is following someone
router.get("/is-following/:userId", authenticateToken, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId);

    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM follows
        WHERE follower_id = $1 AND following_id = $2
      ) as is_following`,
      [followerId, followingId]
    );

    res.json({ isFollowing: result.rows[0].is_following });
  } catch (err) {
    console.error("Check following error:", err);
    res.status(500).json({ error: "Failed to check following status" });
  }
});

// ==================== LIKES ====================

// Like an activity
router.post("/like/:activityId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = parseInt(req.params.activityId);

    await pool.query(
      `INSERT INTO activity_likes (user_id, activity_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, activity_id) DO NOTHING`,
      [userId, activityId]
    );

    res.json({ message: "Liked successfully" });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: "Failed to like activity" });
  }
});

// Unlike an activity
router.delete("/like/:activityId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = parseInt(req.params.activityId);

    await pool.query(
      `DELETE FROM activity_likes
       WHERE user_id = $1 AND activity_id = $2`,
      [userId, activityId]
    );

    res.json({ message: "Unliked successfully" });
  } catch (err) {
    console.error("Unlike error:", err);
    res.status(500).json({ error: "Failed to unlike activity" });
  }
});

// Get users who liked an activity
router.get("/likes/:activityId", async (req, res) => {
  try {
    const activityId = parseInt(req.params.activityId);

    const result = await pool.query(
      `SELECT u.id, u.username, u.profile_image, al.created_at
       FROM activity_likes al
       JOIN users u ON al.user_id = u.id
       WHERE al.activity_id = $1
       ORDER BY al.created_at DESC`,
      [activityId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get likes error:", err);
    res.status(500).json({ error: "Failed to get likes" });
  }
});

// Check if current user liked an activity
router.get("/is-liked/:activityId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = parseInt(req.params.activityId);

    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM activity_likes
        WHERE user_id = $1 AND activity_id = $2
      ) as is_liked`,
      [userId, activityId]
    );

    res.json({ isLiked: result.rows[0].is_liked });
  } catch (err) {
    console.error("Check like error:", err);
    res.status(500).json({ error: "Failed to check like status" });
  }
});

// ==================== COMMENTS ====================

// Add a comment
router.post("/comment/:activityId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activityId = parseInt(req.params.activityId);
    const { comment_text } = req.body;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const result = await pool.query(
      `INSERT INTO activity_comments (user_id, activity_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, activityId, comment_text.trim()]
    );

    // Get user info for the comment
    const commentWithUser = await pool.query(
      `SELECT ac.*, u.username, u.profile_image
       FROM activity_comments ac
       JOIN users u ON ac.user_id = u.id
       WHERE ac.id = $1`,
      [result.rows[0].id]
    );

    res.json(commentWithUser.rows[0]);
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Delete a comment
router.delete("/comment/:commentId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = parseInt(req.params.commentId);

    // Only allow user to delete their own comments
    const result = await pool.query(
      `DELETE FROM activity_comments
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [commentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found or unauthorized" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// Get comments for an activity
router.get("/comments/:activityId", async (req, res) => {
  try {
    const activityId = parseInt(req.params.activityId);

    const result = await pool.query(
      `SELECT ac.*, u.username, u.profile_image
       FROM activity_comments ac
       JOIN users u ON ac.user_id = u.id
       WHERE ac.activity_id = $1
       ORDER BY ac.created_at DESC`,
      [activityId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ error: "Failed to get comments" });
  }
});

// ==================== ACTIVITY FEED ====================

// Get activity feed (activities from users you follow + your own)
router.get("/feed", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT a.*, u.username, u.profile_image,
              a.like_count, a.comment_count,
              EXISTS(
                SELECT 1 FROM activity_likes al
                WHERE al.activity_id = a.id AND al.user_id = $1
              ) as is_liked_by_me
       FROM activities a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = $1
          OR a.user_id IN (
            SELECT following_id FROM follows WHERE follower_id = $1
          )
       ORDER BY a.date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get feed error:", err);
    res.status(500).json({ error: "Failed to get activity feed" });
  }
});

// Get public activity feed (all users, paginated)
router.get("/feed/public", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT a.*, u.username, u.profile_image,
              a.like_count, a.comment_count
       FROM activities a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.date DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get public feed error:", err);
    res.status(500).json({ error: "Failed to get public feed" });
  }
});

export default router;
