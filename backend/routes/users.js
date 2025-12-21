// backend/routes/users.js
import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { validateProfileUpdate } from "../middleware/validation.js";

const router = express.Router();

// --- Fetch all users (optional, for admin or leaderboard use) ---
router.get("/", async (req, res) => {
  try {
    console.log("📡 Fetching users...");
    const result = await pool.query("SELECT id, username, email FROM users");
    console.log("✅ Users fetched:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch users failed:", err.message);
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
});

// --- Update user profile (height, weight, gender, date_of_birth, etc.) ---
router.put("/:id", authenticateToken, validateProfileUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { height, weight, gender, date_of_birth, first_name, last_name } = req.body;

    console.log("📝 Update profile request:", { id, body: req.body, userId: req.user.id });

    // ✅ Ensure users can only edit their own profile
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    // Check which columns exist
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('height', 'weight', 'gender', 'date_of_birth', 'first_name', 'last_name', 'age', 'profile_image', 'is_admin')
    `);
    
    const existingColumns = columnsCheck.rows.map(r => r.column_name);
    console.log("📊 Existing columns:", existingColumns);

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

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(id);
    
    // Build RETURNING clause with only existing columns
    const returningColumns = ['id', 'username', 'email'];
    const updateableColumns = ['height', 'weight', 'gender', 'date_of_birth', 'first_name', 'last_name', 'age'];
    const additionalColumns = ['profile_image', 'is_admin'];
    
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

    console.log("🔧 Update query:", query);
    console.log("🔧 Update values:", values);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ Profile updated successfully");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Update user failed:", err.message, err.stack);
    res.status(500).json({ error: "Error updating profile", details: err.message });
  }
});

export default router;