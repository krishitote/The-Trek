import express from "express";
import axios from "axios";
import pool from "../db.js";

const router = express.Router();

// 1️⃣ Callback: exchange auth code for tokens
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: "https://the-trek.onrender.com/api/googlefit/callback",
      grant_type: "authorization_code",
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // TODO: associate tokens with the logged-in user
    // For now, just display success
    res.send(`<h2>✅ Google Fit Connected!</h2><p>You can close this window.</p>`);
  } catch (err) {
    console.error("❌ Google Fit OAuth failed:", err.response?.data || err.message);
    res.status(500).send("Google Fit connection failed.");
  }
});

// 2️⃣ Fetch activity data
router.get("/sync", async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) return res.status(401).json({ error: "Missing token" });

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await axios.post(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        aggregateBy: [
          { dataTypeName: "com.google.step_count.delta" },
          { dataTypeName: "com.google.distance.delta" },
          { dataTypeName: "com.google.activity.segment" },
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: sevenDaysAgo,
        endTimeMillis: now,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ Sync failed:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch Google Fit data" });
  }
});

<<<<<<< HEAD
export default router;
=======
export default router;
>>>>>>> 6cbbbaf (Added Google Fit and Uploads routes + updated backend files)
