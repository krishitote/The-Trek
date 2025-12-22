import express from "express";
import axios from "axios";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Step 1: Initiate OAuth - user clicks "Connect Google Fit"
router.get("/auth", authenticateToken, (req, res) => {
  const scope = [
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.location.read",
  ].join(" ");
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${req.user.id}`; // Pass user ID in state parameter
  
  res.json({ authUrl });
});

// Step 2: OAuth callback - Google redirects here with authorization code
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  const userId = state; // User ID from state parameter
  
  if (!code || !userId) {
    return res.status(400).send("<h2>❌ Missing authorization code or user ID</h2>");
  }
  
  try {
    // Exchange authorization code for tokens
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Store tokens in database
    await pool.query(
      `INSERT INTO google_fit_tokens (user_id, access_token, refresh_token, token_expires_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, google_fit_tokens.refresh_token),
         token_expires_at = EXCLUDED.token_expires_at,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, access_token, refresh_token, expiresAt]
    );

    res.send(`
      <html>
        <head><title>Google Fit Connected</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>✅ Google Fit Connected Successfully!</h2>
          <p>You can now close this window and return to The Trek.</p>
          <script>window.close();</script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ Google Fit OAuth failed:", err.response?.data || err.message);
    res.status(500).send("<h2>❌ Google Fit connection failed. Please try again.</h2>");
  }
});

// Step 3: Check connection status
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT token_expires_at FROM google_fit_tokens WHERE user_id = $1",
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.json({ connected: false });
    }
    
    const expiresAt = new Date(result.rows[0].token_expires_at);
    const isExpired = expiresAt < new Date();
    
    res.json({ 
      connected: !isExpired,
      expiresAt: result.rows[0].token_expires_at 
    });
  } catch (err) {
    console.error("❌ Status check failed:", err);
    res.status(500).json({ error: "Failed to check connection status" });
  }
});

// Helper: Refresh expired Google token
async function refreshGoogleToken(userId) {
  try {
    const result = await pool.query(
      "SELECT refresh_token FROM google_fit_tokens WHERE user_id = $1",
      [userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].refresh_token) {
      throw new Error("No refresh token available");
    }
    
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      refresh_token: result.rows[0].refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    });
    
    const { access_token, expires_in } = tokenRes.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);
    
    await pool.query(
      `UPDATE google_fit_tokens 
       SET access_token = $1, token_expires_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [access_token, expiresAt, userId]
    );
    
    return access_token;
  } catch (err) {
    console.error("❌ Token refresh failed:", err.response?.data || err.message);
    throw err;
  }
}

// Helper: Get valid Google access token (refresh if expired)
async function getValidGoogleToken(userId) {
  const result = await pool.query(
    "SELECT access_token, token_expires_at FROM google_fit_tokens WHERE user_id = $1",
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error("No Google Fit connection found");
  }
  
  const { access_token, token_expires_at } = result.rows[0];
  const expiresAt = new Date(token_expires_at);
  
  // Refresh if expired or expiring in next 5 minutes
  if (expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    return await refreshGoogleToken(userId);
  }
  
  return access_token;
}

// Step 4: Sync Google Fit data and save to database
router.post("/sync", authenticateToken, async (req, res) => {
  try {
    // Get valid Google access token
    const googleToken = await getValidGoogleToken(req.user.id);
    
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Fetch fitness data from Google Fit
    const response = await axios.post(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        aggregateBy: [
          { dataTypeName: "com.google.step_count.delta" },
          { dataTypeName: "com.google.distance.delta" },
          { dataTypeName: "com.google.activity.segment" },
        ],
        bucketByTime: { durationMillis: 86400000 }, // Daily buckets
        startTimeMillis: sevenDaysAgo,
        endTimeMillis: now,
      },
      { headers: { Authorization: `Bearer ${googleToken}` } }
    );

    // Process and save activities
    const buckets = response.data.bucket || [];
    let activitiesSaved = 0;
    let activitiesSkipped = 0;
    
    for (const bucket of buckets) {
      const date = new Date(parseInt(bucket.startTimeMillis));
      let steps = 0;
      let distanceMeters = 0;
      let activityType = "Steps";
      
      // Extract data from bucket
      for (const dataset of bucket.dataset) {
        if (dataset.point && dataset.point.length > 0) {
          for (const point of dataset.point) {
            if (point.value && point.value.length > 0) {
              const dataTypeName = dataset.dataTypeName;
              
              if (dataTypeName === "com.google.step_count.delta") {
                steps += point.value[0].intVal || 0;
              } else if (dataTypeName === "com.google.distance.delta") {
                distanceMeters += point.value[0].fpVal || 0;
              } else if (dataTypeName === "com.google.activity.segment") {
                // Activity type: 7=Walking, 8=Running, 1=Cycling, 82=Swimming
                const activityId = point.value[0].intVal;
                if (activityId === 8) activityType = "Running";
                else if (activityId === 1) activityType = "Cycling";
                else if (activityId === 82) activityType = "Swimming";
                else if (activityId === 7) activityType = "Walking";
              }
            }
          }
        }
      }
      
      // Only save if there's meaningful data
      const distanceKm = distanceMeters / 1000;
      if (distanceKm > 0.1 || steps > 100) {
        // Check if activity already exists for this date
        const existing = await pool.query(
          "SELECT id FROM activities WHERE user_id = $1 AND date = $2 AND type = $3",
          [req.user.id, date.toISOString().split('T')[0], activityType]
        );
        
        if (existing.rows.length === 0) {
          // Estimate duration (assuming average pace)
          const durationMin = activityType === "Running" ? distanceKm * 6 :
                             activityType === "Cycling" ? distanceKm * 3 :
                             activityType === "Walking" ? distanceKm * 12 :
                             steps / 100; // For steps, rough estimate
          
          await pool.query(
            `INSERT INTO activities (user_id, type, distance_km, duration_min, date)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, activityType, distanceKm, Math.round(durationMin), date.toISOString().split('T')[0]]
          );
          activitiesSaved++;
        } else {
          activitiesSkipped++;
        }
      }
    }

    res.json({ 
      success: true,
      activitiesSaved,
      activitiesSkipped,
      totalDays: buckets.length,
      message: `Synced ${activitiesSaved} new activities from Google Fit`
    });
  } catch (err) {
    console.error("❌ Sync failed:", err.response?.data || err.message);
    
    if (err.message === "No Google Fit connection found") {
      return res.status(404).json({ error: "Please connect Google Fit first" });
    }
    
    res.status(500).json({ 
      error: "Failed to sync Google Fit data",
      details: err.message 
    });
  }
});

// Disconnect Google Fit
router.delete("/disconnect", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM google_fit_tokens WHERE user_id = $1", [req.user.id]);
    res.json({ success: true, message: "Google Fit disconnected" });
  } catch (err) {
    console.error("❌ Disconnect failed:", err);
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

export default router;