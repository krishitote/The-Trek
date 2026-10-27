// backend/routes/users.js
import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { validateProfileUpdate, validateLeaderboardChoice } from "../middleware/validation.js";
import { invalidateCache } from "../middleware/cache.js";

// --- Update user profile (height, weight, gender, date_of_birth, etc.) ---
export function createUserRouter(queryPool = pool, clearLeaderboardCache = invalidateCache) {
const router = express.Router();

router.put("/:id", authenticateToken, validateProfileUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      height,
      weight,
      gender,
      date_of_birth,
      first_name,
      last_name,
      show_on_leaderboard,
    } = req.body;

    // ✅ Ensure users can only edit their own profile
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    // Check which columns exist
    const columnsCheck = await queryPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('height', 'weight', 'gender', 'date_of_birth', 'first_name', 'last_name', 'age', 'profile_image', 'is_admin', 'show_on_leaderboard', 'leaderboard_choice_made_at')
    `);
    
    const existingColumns = columnsCheck.rows.map(r => r.column_name);

    // Calculate age from date_of_birth if provided
    let calculatedAge = null;
    if (date_of_birth) {
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      console.log("🎂 Calculated age from DOB:", calculatedAge);
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (existingColumns.includes('height') && height !== undefined) {
      updates.push(`height = $${paramCount++}`);
      values.push(height);
    }
    if (existingColumns.includes('weight') && weight !== undefined) {
      updates.push(`weight = $${paramCount++}`);
      values.push(weight);
    }
    if (existingColumns.includes('gender') && gender !== undefined) {
      updates.push(`gender = $${paramCount++}`);
      values.push(gender);
    }
    if (existingColumns.includes('date_of_birth') && date_of_birth !== undefined) {
      updates.push(`date_of_birth = $${paramCount++}`);
      values.push(date_of_birth);
    }
    // Auto-update age if date_of_birth changed and age column exists
    if (existingColumns.includes('age') && calculatedAge !== null) {
      updates.push(`age = $${paramCount++}`);
      values.push(calculatedAge);
    }
    if (existingColumns.includes('first_name') && first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(first_name);
    }
    if (existingColumns.includes('last_name') && last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(last_name);
    }
    if (existingColumns.includes('show_on_leaderboard') && show_on_leaderboard !== undefined) {
      updates.push(`show_on_leaderboard = $${paramCount++}`);
      values.push(show_on_leaderboard);
      if (existingColumns.includes('leaderboard_choice_made_at')) {
        updates.push(`leaderboard_choice_made_at = NOW()`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(id);
    
    // Build RETURNING clause with only existing columns
    const returningColumns = ['id', 'username', 'email'];
    const updateableColumns = ['height', 'weight', 'gender', 'date_of_birth', 'first_name', 'last_name', 'age', 'show_on_leaderboard'];
    const additionalColumns = ['profile_image', 'is_admin', 'leaderboard_choice_made_at'];
    
    // Add updateable columns that exist
    updateableColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        returningColumns.push(col);
      }
    });
    
    // Add additional columns that exist
    additionalColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        returningColumns.push(col);
      }
    });
    
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING ${returningColumns.join(', ')}
    `;

    const result = await queryPool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (show_on_leaderboard !== undefined) {
      await clearLeaderboardCache('cache:GET:/api/leaderboards*');
    }

    const { leaderboard_choice_made_at: choiceMadeAt, ...profile } = result.rows[0];
    res.json({
      ...profile,
      ...(existingColumns.includes('leaderboard_choice_made_at')
        ? { leaderboard_choice_made: Boolean(choiceMadeAt) }
        : {}),
    });
  } catch (err) {
    console.error("Profile update failed:", err);
    res.status(500).json({ error: "Error updating profile" });
  }
});

// One-time prompt answer; separate from the profile route, which requires gender and date of birth.
router.put("/:id/leaderboard-visibility", authenticateToken, validateLeaderboardChoice, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || req.user.id !== userId) {
    return res.status(403).json({ error: "You can only change your own leaderboard visibility" });
  }

  try {
    const result = await queryPool.query(
      `UPDATE users
       SET show_on_leaderboard = $1, leaderboard_choice_made_at = NOW()
       WHERE id = $2
       RETURNING show_on_leaderboard, TRUE AS leaderboard_choice_made`,
      [req.body.show_on_leaderboard, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await clearLeaderboardCache('cache:GET:/api/leaderboards*');
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Leaderboard visibility update failed:", err);
    res.status(500).json({ error: "Error saving your choice" });
  }
});

return router;
}

export default createUserRouter();