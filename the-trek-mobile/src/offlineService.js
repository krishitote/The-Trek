// Offline Activity Queue Service
// Handles storing activities offline and syncing when online

import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleLocalNotification } from './notificationService';

const OFFLINE_QUEUE_KEY = '@trek_offline_activities';
const SYNC_STATUS_KEY = '@trek_sync_status';

/**
 * Add activity to offline queue
 */
export async function queueOfflineActivity(activity) {
  try {
    const queue = await getOfflineQueue();
    const queueItem = {
      ...activity,
      id: `offline_${Date.now()}`,
      queuedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };
    
    queue.push(queueItem);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    
    console.log('Activity queued for offline sync:', queueItem.id);
    
    // Notify user
    await scheduleLocalNotification(
      '📴 Activity Saved Offline',
      'Your activity will sync when you\'re back online'
    );
    
    return queueItem;
  } catch (error) {
    console.error('Error queueing offline activity:', error);
    throw error;
  }
}

/**
 * Get all queued offline activities
 */
export async function getOfflineQueue() {
  try {
    const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

/**
 * Get offline queue count
 */
export async function getOfflineQueueCount() {
  const queue = await getOfflineQueue();
  return queue.filter(item => item.syncStatus === 'pending').length;
}

/**
 * Sync offline activities with backend
 */
export async function syncOfflineActivities(apiClient, token) {
  try {
    const queue = await getOfflineQueue();
    const pendingItems = queue.filter(item => item.syncStatus === 'pending');
    
    if (pendingItems.length === 0) {
      console.log('No offline activities to sync');
      return { success: true, synced: 0, failed: 0 };
    }
    
    console.log(`Syncing ${pendingItems.length} offline activities...`);
    
    await setSyncStatus('syncing', pendingItems.length);
    
    let synced = 0;
    let failed = 0;
    const updatedQueue = [...queue];
    
    for (const item of pendingItems) {
      try {
        // Remove offline-specific fields before syncing
        const { id, queuedAt, syncStatus, ...activityData } = item;
        
        // Submit to backend
        const response = await apiClient.submitActivity(activityData, token);
        
        if (response.ok) {
          // Mark as synced
          const index = updatedQueue.findIndex(q => q.id === item.id);
          if (index !== -1) {
            updatedQueue[index].syncStatus = 'synced';
            updatedQueue[index].syncedAt = new Date().toISOString();
            updatedQueue[index].serverId = response.data?.id;
          }
          synced++;
        } else {
          throw new Error(response.error || 'Sync failed');
        }
      } catch (error) {
        console.error(`Failed to sync activity ${item.id}:`, error);
        const index = updatedQueue.findIndex(q => q.id === item.id);
        if (index !== -1) {
          updatedQueue[index].syncStatus = 'failed';
          updatedQueue[index].syncError = error.message;
        }
        failed++;
      }
    }
    
    // Save updated queue
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    
    // Clear synced items after 24 hours (keep for history)
    await clearOldSyncedItems();
    
    await setSyncStatus('idle', 0);
    
    console.log(`Sync complete: ${synced} synced, ${failed} failed`);
    
    // Notify user
    if (synced > 0) {
      await scheduleLocalNotification(
        '✅ Activities Synced',
        `${synced} offline ${synced === 1 ? 'activity' : 'activities'} synced successfully`
      );
    }
    
    return { success: true, synced, failed };
  } catch (error) {
    console.error('Error syncing offline activities:', error);
    await setSyncStatus('error', 0);
    return { success: false, synced: 0, failed: 0, error: error.message };
  }
}

/**
 * Clear synced items older than 24 hours
 */
async function clearOldSyncedItems() {
  try {
    const queue = await getOfflineQueue();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    const filteredQueue = queue.filter(item => {
      if (item.syncStatus === 'synced' && item.syncedAt) {
        const syncedTime = new Date(item.syncedAt).getTime();
        return syncedTime > oneDayAgo;
      }
      return true; // Keep pending and failed items
    });
    
    if (filteredQueue.length < queue.length) {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filteredQueue));
      console.log(`Cleared ${queue.length - filteredQueue.length} old synced items`);
    }
  } catch (error) {
    console.error('Error clearing old synced items:', error);
  }
}

/**
 * Clear all offline queue (admin function)
 */
export async function clearOfflineQueue() {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log('Offline queue cleared');
    return true;
  } catch (error) {
    console.error('Error clearing offline queue:', error);
    return false;
  }
}

/**
 * Get sync status
 */
export async function getSyncStatus() {
  try {
    const statusJson = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return statusJson ? JSON.parse(statusJson) : { status: 'idle', pendingCount: 0 };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return { status: 'idle', pendingCount: 0 };
  }
}

/**
 * Set sync status
 */
async function setSyncStatus(status, pendingCount = 0) {
  try {
    const statusData = {
      status, // 'idle' | 'syncing' | 'error'
      pendingCount,
      lastSync: new Date().toISOString(),
    };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(statusData));
  } catch (error) {
    console.error('Error setting sync status:', error);
  }
}

/**
 * Retry failed sync items
 */
export async function retryFailedSync(apiClient, token) {
  try {
    const queue = await getOfflineQueue();
    
    // Reset failed items to pending
    const updatedQueue = queue.map(item => {
      if (item.syncStatus === 'failed') {
        return { ...item, syncStatus: 'pending', syncError: undefined };
      }
      return item;
    });
    
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    
    // Sync again
    return await syncOfflineActivities(apiClient, token);
  } catch (error) {
    console.error('Error retrying failed sync:', error);
    return { success: false, synced: 0, failed: 0, error: error.message };
  }
}
