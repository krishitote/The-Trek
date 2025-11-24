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

// --- Update user profile (height, weight, etc.) ---
router.put("/:id", authenticateToken, validateProfileUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { height, weight, age, gender, first_name, last_name } = req.body;

    // ✅ Ensure users can only edit their own profile
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    // ✅ Update only fields provided
    const result = await pool.query(
      `UPDATE users
       SET height = COALESCE($1, height),
           weight = COALESCE($2, weight),
           age = COALESCE($3, age),
           gender = COALESCE($4, gender),
           first_name = COALESCE($5, first_name),
           last_name = COALESCE($6, last_name)
       WHERE id = $7
       RETURNING id, username, email, height, weight, age, gender, first_name, last_name, profile_image`,
      [height, weight, age, gender, first_name, last_name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Update user failed:", err.message);
    res.status(500).json({ error: "Error updating profile", details: err.message });
  }
});

export default router;