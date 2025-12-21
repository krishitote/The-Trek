// backend/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db.js";
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyAccessToken,
  getRefreshTokenExpiry 
} from '../utils/tokens.js';
import { 
  validateLogin, 
  validateRegistration,
  validateRefreshToken 
} from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';

dotenv.config();
const router = express.Router();

// Register
router.post("/register", authLimiter, validateRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, is_admin`,
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();
    
    // Store refresh token in database
    await pool.query(
      `UPDATE users 
       SET refresh_token = $1, refresh_token_expires = $2 
       WHERE id = $3`,
      [refreshToken, refreshTokenExpiry, user.id]
    );

    res.json({ 
      accessToken,
      refreshToken,
      user 
    });
  } catch (err) {
    console.error("Registration failed:", err);
    if (err.code === '23505') {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login
router.post("/login", authLimiter, validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();
    
    // Store refresh token in database
    await pool.query(
      `UPDATE users 
       SET refresh_token = $1, refresh_token_expires = $2 
       WHERE id = $3`,
      [refreshToken, refreshTokenExpiry, user.id]
    );
    
    // Don't send password
    delete user.password;
    delete user.refresh_token;

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        gender: user.gender,
        age: user.age,
        weight: user.weight,
        height: user.height,
        profile_image: user.profile_image,
        is_admin: user.is_admin || false
      }
    });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Refresh token endpoint
router.post("/refresh", validateRefreshToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Find user with this refresh token
    const result = await pool.query(
      `SELECT id, username, email, refresh_token_expires 
       FROM users 
       WHERE refresh_token = $1`,
      [refreshToken]
    );
    
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Check if expired
    if (new Date(user.refresh_token_expires) < new Date()) {
      // Clean up expired token
      await pool.query(
        `UPDATE users 
         SET refresh_token = NULL, refresh_token_expires = NULL 
         WHERE id = $1`,
        [user.id]
      );
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    
    // Generate new access token
    const newAccessToken = generateAccessToken(user.id);
    
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh token failed:", err);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Logout (invalidate refresh token)
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await pool.query(
        `UPDATE users 
         SET refresh_token = NULL, refresh_token_expires = NULL 
         WHERE refresh_token = $1`,
        [refreshToken]
      );
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error("Logout failed:", err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
