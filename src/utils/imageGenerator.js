// src/utils/imageGenerator.js

/**
 * Generate a shareable image for an activity
 * @param {Object} activity - Activity object
 * @param {Object} user - User object
 * @returns {Promise<Blob>} - Generated image as Blob
 */
export const generateActivityImage = async (activity, user) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Canvas dimensions (optimized for social media)
  canvas.width = 1200;
  canvas.height = 630;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#22c55e'); // green.500
  gradient.addColorStop(1, '#16a34a'); // green.600
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add pattern overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(i * 60, 0, 30, canvas.height);
  }
  
  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('The Trek', canvas.width / 2, 80);
  
  // Activity type
  const activityType = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
  ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
  ctx.fillText(activityType, canvas.width / 2, 180);
  
  // Stats container
  const statsY = 280;
  const statSpacing = 280;
  const startX = (canvas.width - statSpacing * 2) / 2;
  
  // Distance
  drawStat(ctx, startX, statsY, activity.distance_km, 'km', 'Distance');
  
  // Duration
  drawStat(ctx, startX + statSpacing, statsY, activity.duration_min, 'min', 'Duration');
  
  // Calories (if available)
  if (activity.calories_burned) {
    drawStat(ctx, startX + statSpacing * 2, statsY, activity.calories_burned, 'cal', 'Calories');
  } else {
    // Pace instead
    const pace = (activity.duration_min / activity.distance_km).toFixed(2);
    drawStat(ctx, startX + statSpacing * 2, statsY, pace, 'min/km', 'Pace');
  }
  
  // User info
  ctx.font = '32px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(`by ${user.username || 'Trekker'}`, canvas.width / 2, canvas.height - 60);
  
  // Website
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('trekfit.co.ke', canvas.width / 2, canvas.height - 20);
  
  // Convert to Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
};

/**
 * Generate a shareable image for a badge
 * @param {Object} badge - Badge object
 * @param {Object} user - User object
 * @returns {Promise<Blob>} - Generated image as Blob
 */
export const generateBadgeImage = async (badge, user) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 1200;
  canvas.height = 630;
  
  // Background gradient (orange theme for badges)
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#f59e0b'); // amber.500
  gradient.addColorStop(1, '#d97706'); // amber.600
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Pattern overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(i * 60, 0, 30, canvas.height);
  }
  
  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('The Trek', canvas.width / 2, 80);
  
  // Achievement text
  ctx.font = '36px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText('Achievement Unlocked!', canvas.width / 2, 140);
  
  // Badge icon (emoji)
  ctx.font = '180px system-ui, -apple-system, sans-serif';
  ctx.fillText('🏆', canvas.width / 2, 300);
  
  // Badge name
  ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(badge.name, canvas.width / 2, 420);
  
  // Badge description
  ctx.font = '32px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  
  // Wrap text if too long
  const maxWidth = 1000;
  const words = badge.description.split(' ');
  let line = '';
  let y = 480;
  
  words.forEach((word, i) => {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, canvas.width / 2, y);
      line = word + ' ';
      y += 40;
    } else {
      line = testLine;
    }
  });
  ctx.fillText(line, canvas.width / 2, y);
  
  // User info
  ctx.font = '32px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(`Earned by ${user.username || 'Trekker'}`, canvas.width / 2, canvas.height - 60);
  
  // Website
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('trekfit.co.ke', canvas.width / 2, canvas.height - 20);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
};

/**
 * Helper function to draw a stat on canvas
 */
function drawStat(ctx, x, y, value, unit, label) {
  // Value
  ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(value.toString(), x, y);
  
  // Unit
  ctx.font = '32px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(unit, x, y + 40);
  
  // Label
  ctx.font = '28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(label, x, y + 80);
}

/**
 * Download an image blob
 * @param {Blob} blob - Image blob
 * @param {string} filename - Download filename
 */
export const downloadImage = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
