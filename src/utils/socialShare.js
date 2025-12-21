// src/utils/socialShare.js

/**
 * Generate Twitter share URL
 * @param {string} text - Tweet text
 * @param {string} url - URL to share
 * @param {string[]} hashtags - Array of hashtags (without #)
 */
export const shareToTwitter = (text, url, hashtags = []) => {
  const params = new URLSearchParams({
    text: text,
    url: url,
    hashtags: hashtags.join(','),
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
};

/**
 * Generate Facebook share URL
 * @param {string} url - URL to share
 */
export const shareToFacebook = (url) => {
  const params = new URLSearchParams({
    u: url,
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
};

/**
 * Generate WhatsApp share URL
 * @param {string} text - Message text
 */
export const shareToWhatsApp = (text) => {
  const params = new URLSearchParams({
    text: text,
  });
  return `https://wa.me/?${params.toString()}`;
};

/**
 * Check if Web Share API is supported
 */
export const isWebShareSupported = () => {
  return navigator.share !== undefined;
};

/**
 * Share using Web Share API (mobile)
 * @param {Object} data - Share data object
 * @param {string} data.title - Share title
 * @param {string} data.text - Share text
 * @param {string} data.url - Share URL
 */
export const shareViaWebAPI = async (data) => {
  if (!isWebShareSupported()) {
    throw new Error('Web Share API not supported');
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      // User cancelled the share
      return false;
    }
    throw error;
  }
};

/**
 * Generate share text for an activity
 * @param {Object} activity - Activity object
 */
export const generateActivityShareText = (activity) => {
  const verb = activity.type === 'running' ? 'ran' : 
                activity.type === 'cycling' ? 'cycled' :
                activity.type === 'swimming' ? 'swam' :
                activity.type === 'walking' ? 'walked' :
                activity.type === 'hiking' ? 'hiked' : 'completed';
  
  const pace = activity.duration_min && activity.distance_km 
    ? ` at ${(activity.duration_min / activity.distance_km).toFixed(2)} min/km`
    : '';
  
  const calories = activity.calories_burned 
    ? ` and burned ${activity.calories_burned} calories 🔥`
    : '';

  return `I just ${verb} ${activity.distance_km} km in ${activity.duration_min} minutes${pace}${calories}! 💪`;
};

/**
 * Generate share text for a badge
 * @param {Object} badge - Badge object
 */
export const generateBadgeShareText = (badge) => {
  return `I just earned the "${badge.name}" badge on The Trek! 🏆 ${badge.description}`;
};

/**
 * Generate share URL for the app
 */
export const getAppShareUrl = () => {
  return 'https://trekfit.co.ke';
};

/**
 * Open share dialog in new window
 * @param {string} url - Share URL
 * @param {string} platform - Platform name (for window title)
 */
export const openShareWindow = (url, platform = 'Share') => {
  const width = 600;
  const height = 400;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;
  
  window.open(
    url,
    `${platform} Share`,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
  );
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      document.body.removeChild(textarea);
      throw err;
    }
  }
};
