import React, { useEffect, useState, useRef } from "react";
import { Provider as PaperProvider, Snackbar } from "react-native-paper";
import { AuthProvider } from "./context/AuthContext";
import AppNavigator from "./navigation/AppNavigator";
import {
  registerForPushNotifications,
  setupNotificationListeners,
  scheduleDailyReminder,
} from "./src/notificationService";

export default function App() {
  const [pushToken, setPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const notificationListener = useRef();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        setPushToken(token);
        console.log('Push token registered:', token);
      }
    });

    // Schedule daily activity reminder at 6 PM
    scheduleDailyReminder(18, 0);

    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      (notification) => {
        // Handle notification received while app is open
        console.log('Notification received:', notification);
        setNotification(notification);
        setSnackbarVisible(true);
      },
      (response) => {
        // Handle notification tap
        console.log('Notification tapped:', response);
        // TODO: Navigate to relevant screen based on notification data
      }
    );

    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <PaperProvider>
        <AppNavigator />
        
        {/* Notification Snackbar */}
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'View',
            onPress: () => {
              // TODO: Navigate to notification content
              setSnackbarVisible(false);
            },
          }}
        >
          {notification?.request?.content?.title || 'New notification'}
        </Snackbar>
      </PaperProvider>
    </AuthProvider>
  );
}
