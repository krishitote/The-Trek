import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import sharp from "sharp";
import { createUploadRouter } from "../routes/upload.js";

const jwtSecret = "profile-photo-test-secret";
globalThis.process.env.JWT_SECRET = jwtSecret;

const photos = new Map();
const profileImages = new Map();
const testPool = {
  async query(sql, params = []) {
    const normalizedSql = sql.trimStart().toUpperCase();
    if (normalizedSql.startsWith("INSERT INTO PROFILE_PHOTOS")) {
      photos.set(params[0], { data: params[1], content_type: "image/jpeg" });
      return { rows: [] };
    }
    if (normalizedSql.startsWith("UPDATE USERS")) {
      profileImages.set(params[1], params[0]);
      return { rows: [{ profile_image: params[0] }] };
    }
    if (normalizedSql.startsWith("SELECT DATA")) {
      const photo = photos.get(params[0]);
      return { rows: photo ? [photo] : [] };
    }
    return { rows: [] };
  },
};

const app = express();
app.use("/api/upload", createUploadRouter(testPool));

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

function authHeaders(userId = 7) {
  return { Authorization: `Bearer ${jwt.sign({ id: userId }, jwtSecret)}` };
}

async function pngBlob() {
  const buffer = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#2e7d32" },
  }).png().toBuffer();
  return new Blob([buffer], { type: "image/png" });
}

test("photo uploads require authentication", async () => {
  const response = await fetch(`${baseUrl}/api/upload`, { method: "POST" });

  assert.equal(response.status, 401);
});

test("photo uploads reject unsupported file types", async () => {
  const form = new FormData();
  form.set("photo", new Blob(["not an image"], { type: "text/plain" }), "notes.txt");

  const response = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });

  assert.equal(response.status, 400);
});

test("photo uploads require a photo field", async () => {
  const response = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: new FormData(),
  });

  assert.equal(response.status, 400);
});

test("an uploaded photo is stored in the database and served back resized", async () => {
  const form = new FormData();
  form.set("photo", await pngBlob(), "avatar.png");

  const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: authHeaders(7),
    body: form,
  });
  const { profile_image: profileImage } = await uploadResponse.json();

  assert.equal(uploadResponse.status, 200);
  assert.match(profileImage, /^\/api\/upload\/photo\/7\?v=\d+$/);

  const photoResponse = await fetch(`${baseUrl}${profileImage}`);
  const metadata = await sharp(new Uint8Array(await photoResponse.arrayBuffer())).metadata();

  assert.equal(photoResponse.status, 200);
  assert.equal(photoResponse.headers.get("content-type"), "image/jpeg");
  assert.equal(metadata.width, 400);
  assert.equal(metadata.height, 400);
});

test("a user without a stored photo gets a 404", async () => {
  const response = await fetch(`${baseUrl}/api/upload/photo/99`);

  assert.equal(response.status, 404);
});
