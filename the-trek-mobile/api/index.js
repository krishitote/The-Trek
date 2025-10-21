const API_BASE = "http://192.168.100.64:5000/api"; // replace with your deployed backend URL

export async function register(userData) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function fetchActivities(token) {
  const res = await fetch(`${API_BASE}/activities`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
