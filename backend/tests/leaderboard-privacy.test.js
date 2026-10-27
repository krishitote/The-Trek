import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { createActivityRouter } from "../routes/activities.js";
import { createLeaderboardRouter } from "../routes/leaderboards.js";
import { createUserRouter } from "../routes/users.js";

const jwtSecret = "leaderboard-privacy-test-secret";
globalThis.process.env.JWT_SECRET = jwtSecret;
const queries = [];
const invalidatedCaches = [];
let insertedActivityParams = null;
const testPool = {
  async query(sql, params = []) {
    queries.push(sql);
    const normalizedSql = sql.trimStart().toUpperCase();
    if (normalizedSql.includes("INFORMATION_SCHEMA.COLUMNS")) {
      return {
        rows: ["height", "weight", "gender", "date_of_birth", "first_name", "last_name", "age", "profile_image", "is_admin", "show_on_leaderboard"]
          .map((column_name) => ({ column_name })),
      };
    }
    if (normalizedSql.startsWith("UPDATE USERS")) {
      return {
        rows: [{
          id: Number(params.at(-1)),
          username: "test-user",
          show_on_leaderboard: params.at(-2),
        }],
      };
    }
    if (normalizedSql.startsWith("SELECT WEIGHT FROM USERS")) {
      return { rows: [{ weight: 70 }] };
    }
    if (normalizedSql.startsWith("INSERT INTO ACTIVITIES")) {
      insertedActivityParams = params;
      return {
        rows: [{ id: 12, user_id: params[0], location: params[6], elevation_gain: params[7] }],
      };
    }
    if (sql.includes("FROM activities WHERE user_id")) {
      return { rows: [{ id: 1, user_id: params[0], type: "Running" }] };
    }
    return { rows: [] };
  },
};

const noCache = () => (req, res, next) => next();
const app = express();
app.use(express.json());
app.use("/api/leaderboards", createLeaderboardRouter(testPool, noCache));
app.use("/api/activities", createActivityRouter(testPool, async () => [], async () => {}));
app.use("/api/failing-activities", createActivityRouter({
  async query() {
    throw new Error("column \"location\" of relation \"activities\" does not exist");
  },
}, async () => [], async () => {}));
app.use("/api/users", createUserRouter(testPool, async (pattern) => invalidatedCaches.push(pattern)));

function authHeaders(userId = 7) {
  const token = jwt.sign({ id: userId }, jwtSecret);
  return { Authorization: `Bearer ${token}` };
}

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("quick public leaderboard only queries users who opted in", async () => {
  queries.length = 0;
  const response = await fetch(`${baseUrl}/api/leaderboards/quick`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
  assert.equal(queries.length, 1);
  assert.match(queries[0], /u\.show_on_leaderboard\s*=\s*TRUE/);
});

test("all categorized public leaderboards only query users who opted in", async () => {
  queries.length = 0;
  const response = await fetch(`${baseUrl}/api/leaderboards`);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(result, { allTimeLeaders: [], perActivity: [], perGender: [] });
  assert.equal(queries.length, 3);
  assert.ok(queries.every((sql) => /u\.show_on_leaderboard\s*=\s*TRUE/.test(sql)));
});

test("public users endpoint does not enumerate user records", async () => {
  const response = await fetch(`${baseUrl}/api/users`);

  assert.equal(response.status, 404);
});

test("profile opt-in persists for its owner and invalidates public leaderboard caches", async () => {
  invalidatedCaches.length = 0;
  const response = await fetch(`${baseUrl}/api/users/7`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      gender: "female",
      date_of_birth: "2000-01-01",
      show_on_leaderboard: true,
    }),
  });
  const user = await response.json();

  assert.equal(response.status, 200);
  assert.equal(user.show_on_leaderboard, true);
  assert.deepEqual(invalidatedCaches, ["cache:GET:/api/leaderboards*"]);
});

test("activity collection reads require authentication", async () => {
  const response = await fetch(`${baseUrl}/api/activities`);

  assert.equal(response.status, 401);
});

test("activity reads reject another user's query and path IDs", async () => {
  const queryResponse = await fetch(`${baseUrl}/api/activities?user_id=8`, {
    headers: authHeaders(),
  });
  const pathResponse = await fetch(`${baseUrl}/api/activities/8`, {
    headers: authHeaders(),
  });

  assert.equal(queryResponse.status, 403);
  assert.equal(pathResponse.status, 403);
});

test("activity collection reads only return the authenticated user's records", async () => {
  const response = await fetch(`${baseUrl}/api/activities`, {
    headers: authHeaders(),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [{ id: 1, user_id: 7, type: "Running" }]);
});

test("activity submissions accept and persist location and elevation", async () => {
  insertedActivityParams = null;
  const response = await fetch(`${baseUrl}/api/activities`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "Running",
      distance_km: 4.5,
      duration_min: 30,
      date: new Date().toISOString(),
      location: "Ngong Hills",
      elevation_gain: 125,
    }),
  });
  const activity = await response.json();

  assert.equal(response.status, 200);
  assert.equal(activity.location, "Ngong Hills");
  assert.equal(activity.elevation_gain, 125);
  assert.equal(insertedActivityParams[6], "Ngong Hills");
  assert.equal(insertedActivityParams[7], 125);
});

test("activity submission failures do not expose database error text", async () => {
  const response = await fetch(`${baseUrl}/api/failing-activities`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ type: "Running", distance_km: 4.5, duration_min: 30 }),
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Failed to submit activity" });
});
