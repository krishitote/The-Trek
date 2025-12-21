// Enhanced Activity Tracking Screen with GPS and Photos
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  Paragraph,
  TextInput,
  Chip,
  IconButton,
  Portal,
  Dialog,
  ActivityIndicator,
} from 'react-native-paper';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';
import { apiSubmitActivity } from '../api';
import {
  RouteTracker,
  requestLocationPermissions,
  getCurrentLocation,
  routeToPolyline,
  getMapRegionFromRoute,
} from '../src/gpsService';
import {
  takePhoto,
  pickPhoto,
  uploadPhoto,
} from '../src/photoService';
import {
  queueOfflineActivity,
  syncOfflineActivities,
  getOfflineQueueCount,
} from '../src/offlineService';

const ACTIVITY_TYPES = ['Running', 'Walking', 'Cycling', 'Swimming', 'Hiking'];

export default function EnhancedActivityForm({ navigation }) {
  const { user, session } = useAuth();
  const [type, setType] = useState('Running');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  
  // GPS tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [route, setRoute] = useState([]);
  const [currentStats, setCurrentStats] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const routeTrackerRef = useRef(null);
  
  // Photo state
  const [activityPhoto, setActivityPhoto] = useState(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  
  // Offline state
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkLocationPermissions();
    checkOfflineQueue();
    
    // Initialize route tracker
    routeTrackerRef.current = new RouteTracker();
    
    return () => {
      // Cleanup tracking on unmount
      if (routeTrackerRef.current && isTracking) {
        routeTrackerRef.current.stopTracking();
      }
    };
  }, []);

  const checkLocationPermissions = async () => {
    const permissions = await requestLocationPermissions();
    setLocationEnabled(permissions.foreground);
  };

  const checkOfflineQueue = async () => {
    const count = await getOfflineQueueCount();
    setOfflineCount(count);
  };

  const handleStartTracking = async () => {
    if (!locationEnabled) {
      Alert.alert('Location Required', 'Please enable location services to track your route.');
      return;
    }

    const started = await routeTrackerRef.current.startTracking((stats) => {
      setCurrentStats(stats);
      setRoute(stats.route);
      setDistance(stats.distance.toFixed(2));
      setDuration(stats.duration.toFixed(0));
    });

    if (started) {
      setIsTracking(true);
      setIsPaused(false);
    } else {
      Alert.alert('Error', 'Failed to start GPS tracking');
    }
  };

  const handlePauseTracking = () => {
    if (isPaused) {
      routeTrackerRef.current.resumeTracking((stats) => {
        setCurrentStats(stats);
        setRoute(stats.route);
        setDistance(stats.distance.toFixed(2));
        setDuration(stats.duration.toFixed(0));
      });
      setIsPaused(false);
    } else {
      routeTrackerRef.current.pauseTracking();
      setIsPaused(true);
    }
  };

  const handleStopTracking = async () => {
    const routeData = await routeTrackerRef.current.stopTracking();
    if (routeData) {
      setIsTracking(false);
      setIsPaused(false);
      Alert.alert(
        'Tracking Complete',
        `Distance: ${routeData.totalDistance.toFixed(2)} km\nDuration: ${routeData.durationMin.toFixed(0)} minutes`,
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      setShowPhotoDialog(false);
      const photo = await takePhoto({ quality: 0.8 });
      if (photo) {
        setActivityPhoto(photo);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo: ' + error.message);
    }
  };

  const handlePickPhoto = async () => {
    try {
      setShowPhotoDialog(false);
      const photo = await pickPhoto({ quality: 0.8 });
      if (photo) {
        setActivityPhoto(photo);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photo: ' + error.message);
    }
  };

  const handleSyncOffline = async () => {
    if (!session?.token) {
      Alert.alert('Error', 'Please log in to sync activities');
      return;
    }

    setIsSyncing(true);
    const result = await syncOfflineActivities(
      { submitActivity: (data, token) => apiSubmitActivity(token, data) },
      session.token
    );
    setIsSyncing(false);

    if (result.success) {
      Alert.alert('Sync Complete', `${result.synced} activities synced successfully`);
      checkOfflineQueue();
    } else {
      Alert.alert('Sync Failed', result.error || 'Failed to sync activities');
    }
  };

  const handleSubmit = async () => {
    if (!type || !distance || !duration) {
      Alert.alert('Missing Data', 'Please fill in all required fields');
      return;
    }

    const activityData = {
      type,
      distance_km: parseFloat(distance),
      duration_min: parseFloat(duration),
      calories_burned: calories ? parseInt(calories) : undefined,
      date: new Date().toISOString(),
      route: route.length > 0 ? JSON.stringify(route) : undefined,
    };

    setIsSubmitting(true);

    try {
      if (!session?.token) {
        // Offline mode - queue activity
        await queueOfflineActivity(activityData);
        Alert.alert('Saved Offline', 'Activity will sync when you\'re back online');
        checkOfflineQueue();
        resetForm();
      } else {
        // Online mode - submit directly
        const response = await apiSubmitActivity(session.token, activityData);
        
        if (response.ok) {
          // Upload photo if available
          if (activityPhoto && response.data?.id) {
            await uploadPhoto(activityPhoto, session.token, process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
          }
          
          Alert.alert('Success', 'Activity submitted successfully!');
          resetForm();
          navigation.goBack();
        } else {
          // Failed online - save offline
          await queueOfflineActivity(activityData);
          Alert.alert('Saved Offline', 'Could not submit now. Activity queued for sync.');
          checkOfflineQueue();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      // Save offline as fallback
      await queueOfflineActivity(activityData);
      Alert.alert('Saved Offline', 'Activity will sync when connection is restored');
      checkOfflineQueue();
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDistance('');
    setDuration('');
    setCalories('');
    setRoute([]);
    setActivityPhoto(null);
    setCurrentStats(null);
  };

  const mapRegion = route.length > 0 ? getMapRegionFromRoute(route) : null;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Track Activity</Title>
          
          {/* Offline sync banner */}
          {offlineCount > 0 && (
            <Card style={styles.offlineBanner}>
              <Card.Content style={styles.offlineContent}>
                <Text style={styles.offlineText}>
                  {offlineCount} activity{offlineCount > 1 ? 'ies' : 'y'} pending sync
                </Text>
                <Button
                  mode="contained"
                  compact
                  loading={isSyncing}
                  onPress={handleSyncOffline}
                  disabled={isSyncing}
                >
                  Sync Now
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Activity type selection */}
          <Text style={styles.label}>Activity Type</Text>
          <View style={styles.chipContainer}>
            {ACTIVITY_TYPES.map((activityType) => (
              <Chip
                key={activityType}
                selected={type === activityType}
                onPress={() => setType(activityType)}
                style={styles.chip}
              >
                {activityType}
              </Chip>
            ))}
          </View>

          {/* GPS tracking controls */}
          {locationEnabled && (
            <View style={styles.gpsContainer}>
              <Title>GPS Tracking</Title>
              {!isTracking ? (
                <Button
                  mode="contained"
                  icon="map-marker"
                  onPress={handleStartTracking}
                  style={styles.button}
                >
                  Start GPS Tracking
                </Button>
              ) : (
                <View>
                  <View style={styles.trackingStats}>
                    <Text>Distance: {distance || '0.00'} km</Text>
                    <Text>Duration: {duration || '0'} min</Text>
                    <Text>Points: {route.length}</Text>
                  </View>
                  <View style={styles.trackingButtons}>
                    <Button
                      mode="outlined"
                      icon={isPaused ? 'play' : 'pause'}
                      onPress={handlePauseTracking}
                      style={styles.smallButton}
                    >
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button
                      mode="contained"
                      icon="stop"
                      onPress={handleStopTracking}
                      style={styles.smallButton}
                    >
                      Stop
                    </Button>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Map display */}
          {route.length > 0 && mapRegion && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                showsUserLocation
              >
                <Polyline
                  coordinates={routeToPolyline(route)}
                  strokeColor="#22c55e"
                  strokeWidth={4}
                />
                {route.length > 0 && (
                  <>
                    <Marker
                      coordinate={routeToPolyline(route)[0]}
                      title="Start"
                      pinColor="green"
                    />
                    <Marker
                      coordinate={routeToPolyline(route)[route.length - 1]}
                      title="End"
                      pinColor="red"
                    />
                  </>
                )}
              </MapView>
            </View>
          )}

          {/* Manual entry fields */}
          <Text style={styles.label}>Distance (km)</Text>
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={distance}
            onChangeText={setDistance}
            disabled={isTracking}
            style={styles.input}
          />

          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
            disabled={isTracking}
            style={styles.input}
          />

          <Text style={styles.label}>Calories (optional)</Text>
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={calories}
            onChangeText={setCalories}
            style={styles.input}
          />

          {/* Photo section */}
          <View style={styles.photoSection}>
            <Text style={styles.label}>Activity Photo (optional)</Text>
            {activityPhoto ? (
              <View style={styles.photoPreview}>
                <Text>Photo ready to upload</Text>
                <IconButton
                  icon="close"
                  onPress={() => setActivityPhoto(null)}
                />
              </View>
            ) : (
              <Button
                mode="outlined"
                icon="camera"
                onPress={() => setShowPhotoDialog(true)}
              >
                Add Photo
              </Button>
            )}
          </View>

          {/* Submit button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || isTracking}
            style={styles.submitButton}
          >
            Submit Activity
          </Button>
        </Card.Content>
      </Card>

      {/* Photo picker dialog */}
      <Portal>
        <Dialog visible={showPhotoDialog} onDismiss={() => setShowPhotoDialog(false)}>
          <Dialog.Title>Add Photo</Dialog.Title>
          <Dialog.Content>
            <Button icon="camera" mode="outlined" onPress={handleTakePhoto} style={styles.dialogButton}>
              Take Photo
            </Button>
            <Button icon="image" mode="outlined" onPress={handlePickPhoto} style={styles.dialogButton}>
              Choose from Gallery
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPhotoDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  offlineBanner: {
    backgroundColor: '#fff3cd',
    marginBottom: 16,
  },
  offlineContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineText: {
    color: '#856404',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  gpsContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  trackingStats: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  trackingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  mapContainer: {
    height: 300,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  input: {
    marginBottom: 8,
  },
  photoSection: {
    marginTop: 16,
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  button: {
    marginVertical: 8,
  },
  dialogButton: {
    marginVertical: 8,
  },
});
