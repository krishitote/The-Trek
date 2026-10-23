// backend/routes/upload.js
import express from "express";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import { authenticateToken } from "../middleware/authMiddleware.js";
import pool from "../db.js";

const MAX_BYTES = 5 * 1024 * 1024;

// Memory storage: Render's disk is wiped on restart, so images live in Postgres.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);

    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG and PNG images are allowed"));
  },
});

function handleUpload(req, res, next) {
  upload.single("photo")(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Image must be 5 MB or smaller" });
    }
    if (err?.message === "Only JPEG and PNG images are allowed") {
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      console.error("Upload processing failed:", err);
      return res.status(500).json({ error: "Failed to process upload" });
    }
    next();
  });
}

export function createUploadRouter(queryPool = pool) {
  const router = express.Router();

  // Public so <img> tags can load it; the URL changes on every upload.
  router.get("/photo/:userId", async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(404).end();
    }

    try {
      const result = await queryPool.query(
        "SELECT data, content_type FROM profile_photos WHERE user_id = $1",
        [userId]
      );
      if (!result.rows.length) {
        return res.status(404).end();
      }

      res.set("Content-Type", result.rows[0].content_type);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.send(result.rows[0].data);
    } catch (err) {
      console.error("Photo fetch failed:", err);
      res.status(500).end();
    }
  });

  router.post("/", authenticateToken, handleUpload, async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "A photo is required" });
    }

    try {
      const data = await sharp(req.file.buffer)
        .resize(400, 400, { fit: "cover", position: "center" })
        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
        .toBuffer();

      await queryPool.query(
        `INSERT INTO profile_photos (user_id, data, content_type, updated_at)
         VALUES ($1, $2, 'image/jpeg', NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET data = EXCLUDED.data, content_type = EXCLUDED.content_type, updated_at = NOW()`,
        [req.user.id, data]
      );

      // The version suffix busts the browser's long-lived image cache.
      const imagePath = `/api/upload/photo/${req.user.id}?v=${Date.now()}`;
      const result = await queryPool.query(
        "UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING profile_image",
        [imagePath, req.user.id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ profile_image: result.rows[0].profile_image });
    } catch (err) {
      console.error("Upload failed:", err);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  return router;
}

export default createUploadRouter();
