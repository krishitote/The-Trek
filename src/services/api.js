// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ---------- Helper ----------
async function handleResponse(res) {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return res.json();
}

function authHeaders(token) {
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ---------- Users ----------
export async function apiUsers() {
  const res = await fetch(`${API_URL}/api/users`);
  return handleResponse(res);
}

// ---------- Activities ----------
export async function apiActivities(token = null, userId = null) {
  const url = new URL(`${API_URL}/api/activities`);
  if (userId) url.searchParams.append("user_id", userId);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  return handleResponse(res);
}

export async function apiSubmitActivity(token, body) {
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/activities`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

// ---------- Auth ----------
export async function apiLogin({ username, password }) {
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function apiRegister({
  firstName,
  lastName,
  username,
  email,
  password,
  gender,
  age,
  weight,
  height,
}) {
  const res = await fetch(`${API_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      password,
      gender,
      age,
      weight,
      height,
    }),
  });
  return handleResponse(res);
}

// ---------- Leaderboards ----------
export async function apiLeaderboards() {
  const res = await fetch(`${API_URL}/api/leaderboards`);
  const data = await handleResponse(res);
  return {
    allTimeLeaders: data.allTimeLeaders || [],
    perActivity: data.perActivity || [],
    perGender: data.perGender || [],
  };
}
