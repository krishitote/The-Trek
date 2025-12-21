// GPS Route Tracking Service
// Handles location tracking during activities and route recording

import * as Location from 'expo-location';
import { scheduleLocalNotification } from './notificationService';

/**
 * Request location permissions
 */
export async function requestLocationPermissions() {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      console.log('Foreground location permission not granted');
      return { foreground: false, background: false };
    }
    
    // Request background permission for continuous tracking
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    return {
      foreground: foregroundStatus === 'granted',
      background: backgroundStatus === 'granted',
    };
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return { foreground: false, background: false };
  }
}

/**
 * Check if location services are enabled
 */
export async function checkLocationEnabled() {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
}

/**
 * Get current location
 */
export async function getCurrentLocation() {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * GPS Route Tracker Class
 * Tracks route during activity and calculates distance
 */
export class RouteTracker {
  constructor() {
    this.isTracking = false;
    this.route = [];
    this.totalDistance = 0;
    this.startTime = null;
    this.locationSubscription = null;
    this.lastLocation = null;
  }
  
  /**
   * Start tracking route
   */
  async startTracking(onUpdate) {
    if (this.isTracking) {
      console.log('Already tracking');
      return false;
    }
    
    try {
      // Check permissions
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }
      
      // Reset state
      this.route = [];
      this.totalDistance = 0;
      this.startTime = Date.now();
      this.lastLocation = null;
      
      // Get initial location
      const initialLocation = await getCurrentLocation();
      if (initialLocation) {
        this.route.push(initialLocation);
        this.lastLocation = initialLocation;
      }
      
      // Start watching location
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        (location) => {
          this.handleLocationUpdate(location, onUpdate);
        }
      );
      
      this.isTracking = true;
      console.log('Route tracking started');
      
      await scheduleLocalNotification(
        '🎯 Tracking Started',
        'GPS route recording is active'
      );
      
      return true;
    } catch (error) {
      console.error('Error starting route tracking:', error);
      return false;
    }
  }
  
  /**
   * Handle location update
   */
  handleLocationUpdate(location, onUpdate) {
    const newPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    };
    
    // Add to route
    this.route.push(newPoint);
    
    // Calculate distance from last point
    if (this.lastLocation) {
      const segmentDistance = calculateDistance(
        this.lastLocation.latitude,
        this.lastLocation.longitude,
        newPoint.latitude,
        newPoint.longitude
      );
      
      // Only add if movement is significant (reduces GPS drift)
      if (segmentDistance >= 0.01) { // 10 meters minimum
        this.totalDistance += segmentDistance;
      }
    }
    
    this.lastLocation = newPoint;
    
    // Calculate duration
    const durationMin = (Date.now() - this.startTime) / 60000;
    
    // Call update callback
    if (onUpdate) {
      onUpdate({
        distance: this.totalDistance,
        duration: durationMin,
        route: this.route,
        currentLocation: newPoint,
      });
    }
  }
  
  /**
   * Stop tracking and return route data
   */
  async stopTracking() {
    if (!this.isTracking) {
      console.log('Not currently tracking');
      return null;
    }
    
    try {
      // Stop watching location
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }
      
      this.isTracking = false;
      
      const durationMin = (Date.now() - this.startTime) / 60000;
      
      const routeData = {
        route: this.route,
        totalDistance: this.totalDistance,
        durationMin,
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        points: this.route.length,
      };
      
      console.log('Route tracking stopped:', routeData);
      
      await scheduleLocalNotification(
        '✅ Tracking Complete',
        `Distance: ${this.totalDistance.toFixed(2)} km, Duration: ${durationMin.toFixed(0)} min`
      );
      
      return routeData;
    } catch (error) {
      console.error('Error stopping route tracking:', error);
      return null;
    }
  }
  
  /**
   * Pause tracking
   */
  pauseTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    // Keep route data but stop location updates
  }
  
  /**
   * Resume tracking
   */
  async resumeTracking(onUpdate) {
    if (!this.isTracking) {
      return false;
    }
    
    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          this.handleLocationUpdate(location, onUpdate);
        }
      );
      return true;
    } catch (error) {
      console.error('Error resuming tracking:', error);
      return false;
    }
  }
  
  /**
   * Get current tracking stats
   */
  getCurrentStats() {
    if (!this.isTracking) {
      return null;
    }
    
    const durationMin = (Date.now() - this.startTime) / 60000;
    const pace = this.totalDistance > 0 ? durationMin / this.totalDistance : 0;
    
    return {
      distance: this.totalDistance,
      duration: durationMin,
      pace,
      points: this.route.length,
      isTracking: this.isTracking,
    };
  }
}

/**
 * Convert route to polyline for map display
 */
export function routeToPolyline(route) {
  return route.map(point => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));
}

/**
 * Get map region from route
 */
export function getMapRegionFromRoute(route) {
  if (!route || route.length === 0) {
    return null;
  }
  
  const latitudes = route.map(p => p.latitude);
  const longitudes = route.map(p => p.longitude);
  
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  
  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  
  const deltaLat = (maxLat - minLat) * 1.5; // Add padding
  const deltaLng = (maxLng - minLng) * 1.5;
  
  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: Math.max(deltaLat, 0.01),
    longitudeDelta: Math.max(deltaLng, 0.01),
  };
}
