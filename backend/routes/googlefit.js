import express from "express";
import axios from "axios";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Temporary storage for OAuth state (in production, use Redis)
const pendingAuths = new Map();

// Step 1: Initiate OAuth - user clicks "Connect Google Fit"
router.get("/auth", authenticateToken, (req, res) => {
  const scope = [
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.location.read",
  ].join(" ");
  
  console.log('Generating OAuth URL for user:', req.user.id);
  
  // Generate a unique state token
  const stateToken = `${req.user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Store user ID with state token (expires in 10 minutes)
  pendingAuths.set(stateToken, {
    userId: req.user.id,
    timestamp: Date.now()
  });
  
  // Clean up old entries (older than 10 minutes)
  for (const [key, value] of pendingAuths.entries()) {
    if (Date.now() - value.timestamp > 10 * 60 * 1000) {
      pendingAuths.delete(key);
    }
  }
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(process.env.GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${encodeURIComponent(stateToken)}`; // Pass state token
  
  console.log('Generated authUrl with state token');
  res.json({ authUrl });
});

// Step 2: OAuth callback - Google redirects here with authorization code
router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;
  
  // Log for debugging
  console.log('Google Fit callback received:', { 
    hasCode: !!code, 
    hasState: !!state, 
    state: state,
    error,
    allParams: Object.keys(req.query),
    fullQuery: req.query
  });
  
  if (error) {
    console.error('Google OAuth error:', error);
    return res.status(400).send(`<h2>❌ Google authorization failed: ${error}</h2>`);
  }
  
  if (!code) {
    return res.status(400).send("<h2>❌ Missing authorization code</h2><p>Please try connecting again.</p>");
  }
  
  let userId;
  
  if (!state) {
    console.warn('No state parameter received from Google - using fallback');
    
    // TEMPORARY WORKAROUND: If no state, show a page that posts message to parent
    // This allows the frontend to handle the connection with the user's session
    return res.send(`
      <html>
        <head><title>Google Fit Authorization</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>⏳ Completing authorization...</h2>
          <p>Please wait while we complete the connection.</p>
          <script>
            // Post the code back to the parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_FIT_AUTH',
                code: '${code}'
              }, '${process.env.GOOGLE_REDIRECT_URI.includes('localhost') ? 'http://localhost:5173' : 'https://trekfit.co.ke'}');
              setTimeout(() => {
                window.close();
              }, 1000);
            } else {
              document.body.innerHTML = '<h2>❌ Error</h2><p>Unable to communicate with parent window. Please close this window and try again.</p>';
            }
          </script>
        </body>
      </html>
    `);
  }
  
  // Retrieve user ID from pending auths
  const authData = pendingAuths.get(state);
  
  if (!authData) {
    console.error('State not found in pendingAuths map:', state);
    return res.status(400).send(`
      <html>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
          <h2>❌ Invalid or expired state token</h2>
          <p>Your authorization session may have expired. Please try connecting again.</p>
          <p><small>State received: ${state}</small></p>
          <button onclick="window.close()">Close Window</button>
        </body>
      </html>
    `);
  }
  
  userId = authData.userId;
  pendingAuths.delete(state); // Clean up used state
  
  console.log('Retrieved user ID from state:', userId);
  
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

// Step 3b: Exchange code for tokens (fallback when state not working)
router.post("/exchange-code", authenticateToken, async (req, res) => {
  const { code, redirectUri } = req.body;
  const userId = req.user.id;
  
  console.log('Exchanging code for user:', userId);
  console.log('Redirect URI:', redirectUri);
  
  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }
  
  // Use the redirect URI from the request (frontend callback) or fall back to backend
  const actualRedirectUri = redirectUri || process.env.GOOGLE_REDIRECT_URI;
  
  try {
    // Exchange authorization code for tokens
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: actualRedirectUri,
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

    console.log('✅ Google Fit tokens stored for user:', userId);
    res.json({ success: true, message: "Google Fit connected successfully" });
  } catch (err) {
    console.error("❌ Token exchange failed:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to exchange authorization code" });
  }
});

// Step 4: Check connection status
router.get("/status", authenticateToken, async (req, res) => {
  try {
    // Check if table exists first
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'google_fit_tokens'
      )`
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log('google_fit_tokens table does not exist yet');
      return res.json({ connected: false });
    }
    
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
    // Return false instead of 500 error
    res.json({ connected: false, error: err.message });
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