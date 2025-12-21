// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  const res = await fetch(`${API_URL}/api/activities`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

// ---------- Auth ----------
export async function apiLogin({ username, password }) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function apiRegister({ username, email, password }) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(res);
}

export async function apiRefreshToken(refreshToken) {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  return handleResponse(res);
}

export async function apiLogout(refreshToken) {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
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

export async function apiQuickLeaderboard() {
  const res = await fetch(`${API_URL}/api/leaderboards/quick`);
  return handleResponse(res);
}
// ---------- Communities ----------
export async function apiGetCommunities(token) {
  const res = await fetch(`${API_URL}/api/communities`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiCreateCommunity(token, body) {
  const res = await fetch(`${API_URL}/api/communities`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(body) });
  return handleResponse(res);
}

export async function apiJoinCommunity(token, inviteCode) {
  const res = await fetch(`${API_URL}/api/communities/join`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ invite_code: inviteCode }) });
  return handleResponse(res);
}

export async function apiLeaveCommunity(token, communityId) {
  const res = await fetch(`${API_URL}/api/communities/${communityId}/leave`, { method: 'POST', headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetCommunityLeaderboard(communityId) {
  const res = await fetch(`${API_URL}/api/communities/${communityId}/leaderboard`);
  return handleResponse(res);
}

// ---------- Championships ----------
export async function apiGetCurrentChampionship() {
  const res = await fetch(`${API_URL}/api/championships/current`);
  return handleResponse(res);
}

export async function apiGetChampionshipQualifiers() {
  const res = await fetch(`${API_URL}/api/championships/qualifiers`);
  return handleResponse(res);
}

export async function apiGetMyChampionshipStatus(token) {
  const res = await fetch(`${API_URL}/api/championships/my-status`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiRegisterForChampionship(token) {
  const res = await fetch(`${API_URL}/api/championships/register`, { method: 'POST', headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiContributeToChampionship(token, amount) {
  const res = await fetch(`${API_URL}/api/championships/contribute`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ amount }) });
  return handleResponse(res);
}

// ---------- Stats & Analytics ----------
export async function apiGetPersonalRecords(token) {
  const res = await fetch(`${API_URL}/api/stats/personal-records`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetWeeklyProgress(token) {
  const res = await fetch(`${API_URL}/api/stats/weekly-progress`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetMonthlyProgress(token) {
  const res = await fetch(`${API_URL}/api/stats/monthly-progress`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetActivityBreakdown(token) {
  const res = await fetch(`${API_URL}/api/stats/activity-breakdown`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetActivityCalendar(token) {
  const res = await fetch(`${API_URL}/api/stats/activity-calendar`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetWeeklyGoal(token) {
  const res = await fetch(`${API_URL}/api/stats/weekly-goal`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiSetWeeklyGoal(token, goal) {
  const res = await fetch(`${API_URL}/api/stats/weekly-goal`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ goal }) });
  return handleResponse(res);
}

export async function apiGetCaloriesBurned(token) {
  const res = await fetch(`${API_URL}/api/stats/calories-burned`, { headers: authHeaders(token) });
  return handleResponse(res);
}

// ===================== BADGES =====================
export async function apiGetAllBadges() {
  const res = await fetch(`${API_URL}/api/badges`);
  return handleResponse(res);
}

export async function apiGetEarnedBadges(token) {
  const res = await fetch(`${API_URL}/api/badges/earned`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetBadgeProgress(token) {
  const res = await fetch(`${API_URL}/api/badges/progress`, { headers: authHeaders(token) });
  return handleResponse(res);
}

// ===================== SOCIAL =====================
// Follows
export async function apiFollowUser(token, userId) {
  const res = await fetch(`${API_URL}/api/social/follow/${userId}`, { method: 'POST', headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiUnfollowUser(token, userId) {
  const res = await fetch(`${API_URL}/api/social/follow/${userId}`, { method: 'DELETE', headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetFollowers(userId) {
  const res = await fetch(`${API_URL}/api/social/followers/${userId}`);
  return handleResponse(res);
}

export async function apiGetFollowing(userId) {
  const res = await fetch(`${API_URL}/api/social/following/${userId}`);
  return handleResponse(res);
}

export async function apiIsFollowing(token, userId) {
  const res = await fetch(`${API_URL}/api/social/is-following/${userId}`, { headers: authHeaders(token) });
  return handleResponse(res);
}

// Likes
export async function apiLikeActivity(token, activityId) {
  const res = await fetch(`${API_URL}/api/social/like/${activityId}`, { method: 'POST', headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiUnlikeActivity(token, activityId) {
  const res = await fetch(`${API_URL}/api/social/like/${activityId}`, { method: 'DELETE', headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetActivityLikes(activityId) {
  const res = await fetch(`${API_URL}/api/social/likes/${activityId}`);
  return handleResponse(res);
}

export async function apiIsLiked(token, activityId) {
  const res = await fetch(`${API_URL}/api/social/is-liked/${activityId}`, { headers: authHeaders(token) });
  return handleResponse(res);
}

// Comments
export async function apiAddComment(token, activityId, commentText) {
  const res = await fetch(`${API_URL}/api/social/comment/${activityId}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ comment_text: commentText })
  });
  return handleResponse(res);
}

export async function apiDeleteComment(token, commentId) {
  const res = await fetch(`${API_URL}/api/social/comment/${commentId}`, { method: 'DELETE', headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetActivityComments(activityId) {
  const res = await fetch(`${API_URL}/api/social/comments/${activityId}`);
  return handleResponse(res);
}

// Feed
export async function apiGetFeed(token, limit = 20, offset = 0) {
  const res = await fetch(`${API_URL}/api/social/feed?limit=${limit}&offset=${offset}`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function apiGetPublicFeed(limit = 20, offset = 0) {
  const res = await fetch(`${API_URL}/api/social/feed/public?limit=${limit}&offset=${offset}`);
  return handleResponse(res);
}
