// src/utils/pwa.js

let deferredPrompt = null;

/**
 * Register service worker for PWA
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('Service Worker registered successfully:', registration.scope);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('Service Workers not supported');
    return null;
  }
};

/**
 * Unregister service worker
 */
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
};

/**
 * Listen for install prompt
 */
export const setupInstallPrompt = (callback) => {
  const handleBeforeInstall = (e) => {
    console.log('[PWA] beforeinstallprompt event fired');
    // Don't prevent default - let browser handle it naturally
    // Store the event for later use
    deferredPrompt = e;
    if (callback) callback(true);
  };

  const handleAppInstalled = () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
    if (callback) callback(false);
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstall);
  window.addEventListener('appinstalled', handleAppInstalled);

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    window.removeEventListener('appinstalled', handleAppInstalled);
  };
};

/**
 * Show install prompt manually
 */
export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available');
    return { outcome: 'no-prompt', error: 'Install prompt not available' };
  }

  try {
    console.log('[PWA] Showing install prompt');
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);
    deferredPrompt = null;
    
    return { outcome };
  } catch (error) {
    console.error('[PWA] Error showing prompt:', error);
    return { outcome: 'error', error: error.message };
  }
};

/**
 * Check if app is installed (running as PWA)
 */
export const isPWA = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

/**
 * Check if app can be installed
 */
export const canInstall = () => {
  return deferredPrompt !== null;
};

/**
 * Request permission for notifications
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

/**
 * Show notification
 */
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: '/icon-192.png',
        ...options,
      });
    }
  }
};
