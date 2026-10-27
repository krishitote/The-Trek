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
let dailyMinutes = 0;
const testPool = {
  async query(sql, params = []) {
    queries.push(sql);
    const normalizedSql = sql.trimStart().toUpperCase();
    if (normalizedSql.includes("INFORMATION_SCHEMA.COLUMNS")) {
      return {
        rows: ["height", "weight", "gender", "date_of_birth", "first_name", "last_name", "age", "profile_image", "is_admin", "show_on_leaderboard", "leaderboard_choice_made_at"]
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
    if (normalizedSql.startsWith("WITH TOTALS")) {
      return {
        rows: [params[0] === 9
          ? { total_distance: "12.50", show_on_leaderboard: false, rank: null, total_users: "3" }
          : { total_distance: "42.5", show_on_leaderboard: true, rank: "2", total_users: "3" }],
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
    if (normalizedSql.includes("SUM(DURATION_MIN)")) {
      return { rows: [{ minutes: dailyMinutes }] };
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
  assert.deepEqual(result, { period: "week", allTimeLeaders: [], perActivity: [], perGender: [] });
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

test("own leaderboard stats require authentication", async () => {
  const response = await fetch(`${baseUrl}/api/leaderboards/me`);

  assert.equal(response.status, 401);
});

test("an opted-in user gets their distance and rank", async () => {
  const response = await fetch(`${baseUrl}/api/leaderboards/me`, { headers: authHeaders(7) });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    totalDistance: 42.5,
    showOnLeaderboard: true,
    rank: 2,
    totalUsers: 3,
  });
});

test("an opted-out user still sees their own distance but has no rank", async () => {
  const response = await fetch(`${baseUrl}/api/leaderboards/me`, { headers: authHeaders(9) });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    totalDistance: 12.5,
    showOnLeaderboard: false,
    rank: null,
    totalUsers: 3,
  });
});

test("leaderboards count hiking and only group male and female athletes", async () => {
  queries.length = 0;
  await fetch(`${baseUrl}/api/leaderboards`);

  assert.equal(queries.length, 3);
  assert.ok(queries.every((sql) => sql.includes("'Hiking'")));
  assert.match(queries[2], /LOWER\(u\.gender\) IN \('male','female'\)/);
});

test("profile updates reject genders other than male or female", async () => {
  const response = await fetch(`${baseUrl}/api/users/7`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ gender: "other", date_of_birth: "2000-01-01" }),
  });

  assert.equal(response.status, 400);
});

test("leaderboards default to the last 7 days and support 30 days and all time", async () => {
  const intervalFor = async (suffix) => {
    queries.length = 0;
    const response = await fetch(`${baseUrl}/api/leaderboards${suffix}`);
    assert.equal(response.status, 200);
    return queries.map((sql) => sql.match(/INTERVAL '(\d+) days'/)?.[1] ?? null);
  };

  assert.deepEqual(await intervalFor(""), ["7", "7", "7"]);
  assert.deepEqual(await intervalFor("?period=week"), ["7", "7", "7"]);
  assert.deepEqual(await intervalFor("?period=month"), ["30", "30", "30"]);
  assert.deepEqual(await intervalFor("?period=all"), [null, null, null]);
});

test("leaderboards reject an unknown period", async () => {
  const response = await fetch(`${baseUrl}/api/leaderboards?period=forever`);

  assert.equal(response.status, 400);
});

test("overall and gender boards rank by points and every board is capped at ten", async () => {
  queries.length = 0;
  await fetch(`${baseUrl}/api/leaderboards`);

  assert.match(queries[0], /ORDER BY points DESC, MAX\(a\.date\) ASC/);
  assert.match(queries[0], /LIMIT 10/);
  assert.match(queries[1], /board_position <= 10/);
  assert.match(queries[1], /ORDER BY SUM\(a\.distance_km\) DESC/);
  assert.match(queries[2], /board_position <= 10/);
  assert.match(queries[2], /WHEN 'Swimming' THEN 4/);
});

test("public leaderboards do not expose gender outside the gender board", async () => {
  queries.length = 0;
  await fetch(`${baseUrl}/api/leaderboards`);

  assert.doesNotMatch(queries[0], /u\.gender/);
  assert.doesNotMatch(queries[1], /u\.gender/);
});

test("activity submissions reject implausible pace and oversized distances", async () => {
  insertedActivityParams = null;
  const submit = (body) => fetch(`${baseUrl}/api/activities`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const tooFast = await submit({ type: "Running", distance_km: 50, duration_min: 30 });
  const tooFar = await submit({ type: "Walking", distance_km: 150, duration_min: 1000 });
  const bodyOfTooFast = await tooFast.json();

  assert.equal(tooFast.status, 400);
  assert.match(bodyOfTooFast.details, /too fast for Running/);
  assert.equal(tooFar.status, 400);
  assert.equal(insertedActivityParams, null);
});

test("activity submissions cannot exceed 24 hours of activity in one day", async () => {
  insertedActivityParams = null;
  dailyMinutes = 1420;
  const response = await fetch(`${baseUrl}/api/activities`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ type: "Walking", distance_km: 3, duration_min: 30 }),
  });
  dailyMinutes = 0;

  assert.equal(response.status, 400);
  assert.equal(insertedActivityParams, null);
});

test("the one-time leaderboard choice is owner-only, validated, and clears cached rankings", async () => {
  invalidatedCaches.length = 0;
  const choose = (id, body, userId = 7) => fetch(`${baseUrl}/api/users/${id}/leaderboard-visibility`, {
    method: "PUT",
    headers: { ...authHeaders(userId), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  assert.equal((await choose(8, { show_on_leaderboard: true })).status, 403);
  assert.equal((await choose(7, { show_on_leaderboard: "yes" })).status, 400);
  assert.equal((await choose(7, {})).status, 400);
  assert.deepEqual(invalidatedCaches, []);

  const response = await choose(7, { show_on_leaderboard: true });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).show_on_leaderboard, true);
  assert.deepEqual(invalidatedCaches, ["cache:GET:/api/leaderboards*"]);
});
