// backend/server.js
import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {Pool} from "pg";
import authRoutes from "./routes/auth.js";
import activityRoutes from "./routes/activities.js";
import userRoutes from "./routes/users.js";
import uploadRoutes from "./routes/upload.js";
import googleFitRoutes from "./routes/googlefit.js";


dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// PostgreSQL pool setup
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

//Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/googlefit", googleFitRoutes);

// Photo
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static("uploads")); // serve static files

// --- Health Check Route ---
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json({ status: "ok", time: result.rows[0].current_time });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// -------------------- Helper functions --------------------
function generateToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Calculate BMI
function calculateBMI(weight, height) {
  if (!weight || !height) return null;
  // height is in cm, convert to meters
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  return Math.round(bmi * 10) / 10; // round to 1 decimal place
}

// Middleware: authenticate
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Missing token" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// -------------------- Routes --------------------

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Trek backend is running!");
});

// -------------------- Register --------------------
app.post("/api/register", async (req, res) => {
  const {
    first_name,
    last_name,
    username,
    email,
    password,
    gender,
    age,
    weight,
    height,
  } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: "Username, email, and password are required" });

  try {
    const hashed = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users
        (first_name, last_name, username, email, password, gender, age, weight, height)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, first_name, last_name, username, email, gender, age, weight, height`,
      [
        first_name || null,
        last_name || null,
        username,
        email,
        hashed,
        gender || null,
        age || null,
        weight || null,
        height || null,
      ]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    const bmi = calculateBMI(user.weight, user.height);
    
    res.json({ token, user: { ...user, bmi } });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: "User registration failed" });
  }
});

// -------------------- Login --------------------
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "User not found" });

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = generateToken(user);
    delete user.password;
    const bmi = calculateBMI(user.weight, user.height);
    res.json({ token, user: { ...user, bmi } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// -------------------- Users --------------------
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id as user_id, first_name, last_name, username, email, gender, age, weight, height FROM users"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// -------------------- Activities --------------------
app.get("/api/activities", async (req, res) => {
  const userId = req.query.user_id;
  let query = "SELECT * FROM activities";
  const params = [];
  if (userId) {
    query += " WHERE user_id = $1";
    params.push(userId);
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

app.post("/api/activities", authMiddleware, async (req, res) => {
  const { type, distance_km, duration_min, date } = req.body;
  if (!type || !distance_km || !duration_min)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const result = await pool.query(
      `INSERT INTO activities (user_id, type, distance_km, duration_min, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.userId, type, distance_km, duration_min, date || new Date()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit activity" });
  }
});

// -------------------- Leaderboards --------------------
app.get("/api/leaderboards", async (req, res) => {
  try {
    // Top 3 All-time leaders
    const allTime = await pool.query(`
      SELECT u.id as user_id, u.username, u.gender,
             SUM(a.distance_km) AS total_distance,
             AVG(a.duration_min / NULLIF(a.distance_km,0)) AS avg_pace
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps')
      GROUP BY u.id, u.username, u.gender
      ORDER BY total_distance DESC
      LIMIT 3
    `);

    // Leaders per activity type
    const perActivity = await pool.query(`
      SELECT a.type, u.id as user_id, u.username, u.gender,
             SUM(a.distance_km) AS total_distance,
             AVG(a.duration_min / NULLIF(a.distance_km,0)) AS avg_pace
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps')
      GROUP BY a.type, u.id, u.username, u.gender
      ORDER BY a.type, total_distance DESC
    `);

    // Leaders per gender
    const perGender = await pool.query(`
      SELECT u.gender, u.id as user_id, u.username,
             SUM(a.distance_km) AS total_distance,
             AVG(a.duration_min / NULLIF(a.distance_km,0)) AS avg_pace
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE a.type IN ('Running','Walking','Cycling','Swimming','Steps')
      GROUP BY u.gender, u.id, u.username
      ORDER BY u.gender, total_distance DESC
    `);

    res.json({
      allTimeLeaders: allTime.rows,
      perActivity: perActivity.rows,
      perGender: perGender.rows,
    });
  } catch (err) {
    console.error("Error fetching leaderboards:", err);
    res.status(500).json({ error: "Failed to fetch leaderboards" });
  }
});

// -------------------- Update User Weight & Height --------------------
app.put("/api/users/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  let { weight, height } = req.body; // note: let so we can convert below

  // Only allow users to update their own profile
  if (parseInt(id) !== req.userId) {
    return res.status(403).json({ error: "You can only update your own profile" });
  }

  // Convert empty strings to null and ensure numbers
  weight = weight !== undefined && weight !== "" ? Number(weight) : null;
  height = height !== undefined && height !== "" ? Number(height) : null;

  if (weight == null && height == null) {
    return res.status(400).json({ error: "Please provide weight or height to update" });
  }

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (weight != null) {
      fields.push(`weight = $${idx}`);
      values.push(weight);
      idx++;
    }
    if (height != null) {
      fields.push(`height = $${idx}`);
      values.push(height);
      idx++;
    }

    values.push(req.userId); // for WHERE clause

    const result = await pool.query(
      `UPDATE users 
       SET ${fields.join(", ")} 
       WHERE id = $${idx} 
       RETURNING id as user_id, first_name, last_name, username, email, gender, age, weight, height`,
      values
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = result.rows[0];
    const bmi = calculateBMI(updatedUser.weight, updatedUser.height);

    res.status(200).json({ ...updatedUser, bmi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// -------------------- Start server --------------------
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
