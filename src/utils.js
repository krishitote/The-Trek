// src/utils.js

// Calculate leaderboard for users based on activities
export function calculateLeaderboard(users, activities) {
  return users.map(u => {
    const userActs = activities.filter(a => a.user_id === u.user_id);
    const totalDistance = userActs.reduce((sum, a) => sum + (a.distance_km || 0), 0);
    const bestPace = userActs.length
      ? Math.min(...userActs.map(a => (a.distance_km > 0 ? a.duration_min / a.distance_km : Infinity)))
      : null;
    return { ...u, totalDistance, bestPace, activitiesCount: userActs.length };
  }).sort((a, b) => b.totalDistance - a.totalDistance);
}
