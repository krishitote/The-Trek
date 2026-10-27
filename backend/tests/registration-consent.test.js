import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import { createAuthRouter } from "../routes/auth.js";

globalThis.process.env.JWT_SECRET = "registration-consent-test-secret";

let lastInsert = null;
const testPool = {
  async query(sql, params = []) {
    const normalizedSql = sql.trimStart().toUpperCase();
    if (normalizedSql.startsWith("INSERT INTO USERS")) {
      lastInsert = params;
      const [username, email, , showOnLeaderboard, choiceMade] = params;
      return {
        rows: [{
          id: 31,
          username,
          email,
          is_admin: false,
          show_on_leaderboard: showOnLeaderboard,
          leaderboard_choice_made: choiceMade,
        }],
      };
    }
    return { rows: [] };
  },
};

const app = express();
app.use(express.json());
app.use("/api/auth", createAuthRouter(testPool));

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

const register = (extra = {}) => fetch(`${baseUrl}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "newtrekker",
    email: "newtrekker@example.com",
    password: "Passw0rdOK",
    ...extra,
  }),
});

test("registering with the consent box ticked makes the user public and records the choice", async () => {
  const response = await register({ show_on_leaderboard: true });
  const { user } = await response.json();

  assert.equal(response.status, 200);
  assert.equal(lastInsert[3], true);
  assert.equal(lastInsert[4], true);
  assert.equal(user.show_on_leaderboard, true);
});

test("registering with the box unticked stays hidden but counts as a choice", async () => {
  await register({ show_on_leaderboard: false });

  assert.equal(lastInsert[3], false);
  assert.equal(lastInsert[4], true);
});

test("registering without a choice stays hidden and is asked later", async () => {
  await register();

  assert.equal(lastInsert[3], false);
  assert.equal(lastInsert[4], false);
});

test("registration rejects a non-boolean consent value", async () => {
  lastInsert = null;
  const response = await register({ show_on_leaderboard: "maybe" });

  assert.equal(response.status, 400);
  assert.equal(lastInsert, null);
});
