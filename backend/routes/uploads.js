// backend/routes/upload.js
import express from "express";
import multer from "multer";
import path from "path";
import { authenticateToken } from "../middleware/authMiddleware.js";
import pool from "../db.js";

const router = express.Router();

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Upload profile photo
router.post("/", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const imagePath = `/uploads/${req.file.filename}`;

    // Update the user record
    const result = await pool.query(
      "UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING profile_image",
      [imagePath, req.user.id]
    );

    res.json({ profile_image: result.rows[0].profile_image });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ message: "Failed to upload photo" });
  }
});

export default router;