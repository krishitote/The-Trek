import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Box, 
  Button, 
  Text, 
  VStack, 
  useToast,
  Badge,
  HStack,
  Spinner
} from "@chakra-ui/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function GoogleFitConnect() {
  const { session } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  // Check connection status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/googlefit/status`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const data = await res.json();
      setConnected(data.connected);
    } catch (err) {
      console.error("Failed to check Google Fit status:", err);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleFit = async () => {
    if (!session?.accessToken) {
      toast({
        title: "Authentication required",
        description: "Please log in to connect Google Fit",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      // Build OAuth URL directly to use frontend callback page
      const clientId = '552143940046-1ho0b0377ui9jsvma0p2qm2ot8is4kct.apps.googleusercontent.com';
      const redirectUri = `${window.location.origin}/googlefit-callback.html`;
      const scope = 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.location.read';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
      
      console.log('Auth URL:', authUrl);
      console.log('Redirect URI:', redirectUri);
      
      // Listen for postMessage from popup (fallback for missing state parameter)
      const messageHandler = async (event) => {
        // Verify origin - accept messages from same origin (our callback page)
        console.log('Received postMessage from origin:', event.origin);
        console.log('Current origin:', window.location.origin);
        console.log('Message data:', event.data);
        
        if (event.origin !== window.location.origin) {
          console.log('Rejected message from origin:', event.origin);
          return;
        }
        
        if (event.data && event.data.type === 'GOOGLE_FIT_AUTH' && event.data.code) {
          console.log('Received auth code via postMessage:', event.data.code);
          window.removeEventListener('message', messageHandler);
          
          // Exchange code for tokens via backend
          try {
            const redirectUri = `${window.location.origin}/googlefit-callback.html`;
            const exchangeRes = await fetch(`${API_URL}/api/googlefit/exchange-code`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`
              },
              body: JSON.stringify({ 
                code: event.data.code,
                redirectUri: redirectUri
              })
            });
            
            if (!exchangeRes.ok) {
              throw new Error('Failed to exchange code');
            }
            
            toast({
              title: "Google Fit Connected!",
              description: "You can now sync your fitness data",
              status: "success",
              duration: 3000,
            });
            
            // Re-check status
            setTimeout(() => checkStatus(), 1000);
          } catch (err) {
            console.error('Code exchange failed:', err);
            toast({
              title: "Connection failed",
              description: "Failed to complete Google Fit connection",
              status: "error",
              duration: 5000,
            });
          }
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Open Google OAuth in new window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        authUrl,
        "Google Fit Authorization",
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Check if popup was blocked
      if (!popup) {
        window.removeEventListener('message', messageHandler);
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site",
          status: "error",
          duration: 5000,
        });
        return;
      }
      
      // No need to poll popup.closed - we rely entirely on postMessage
      // Just cleanup listener after 2 minutes timeout
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        console.log('OAuth flow timeout - cleaning up listener');
      }, 120000);
      
    } catch (err) {
      console.error("Connection failed:", err);
      toast({
        title: "Connection failed",
        description: "Failed to connect Google Fit",
        status: "error",
        duration: 5000,
      });
    }
  };

  const syncGoogleFit = async () => {
    if (!session?.accessToken) return;
    
    setSyncing(true);
    try {
      const res = await fetch(`${API_URL}/api/googlefit/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      
      if (!res.ok) {
        throw new Error("Sync failed");
      }
      
      const data = await res.json();
      
      toast({
        title: "Sync completed!",
        description: `${data.activitiesSaved} new activities synced from Google Fit`,
        status: "success",
        duration: 5000,
      });
      
      // Reload page to show new activities
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (err) {
      console.error("Sync failed:", err);
      toast({
        title: "Sync failed",
        description: "Failed to sync Google Fit data",
        status: "error",
        duration: 5000,
      });
    } finally {
      setSyncing(false);
    }
  };

  const disconnectGoogleFit = async () => {
    if (!session?.accessToken) return;
    
    try {
      const res = await fetch(`${API_URL}/api/googlefit/disconnect`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      
      if (!res.ok) throw new Error("Disconnect failed");
      
      setConnected(false);
      toast({
        title: "Disconnected",
        description: "Google Fit has been disconnected",
        status: "info",
        duration: 3000,
      });
    } catch (err) {
      console.error("Disconnect failed:", err);
      toast({
        title: "Error",
        description: "Failed to disconnect",
        status: "error",
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <Box p={4} borderWidth={1} borderRadius="lg" bg="gray.50">
        <HStack>
          <Spinner size="sm" />
          <Text>Checking Google Fit connection...</Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" bg="gray.50">
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="lg">Google Fit Integration</Text>
          {connected && (
            <Badge colorScheme="green">Connected</Badge>
          )}
        </HStack>
        
        {connected ? (
          <>
            <Text fontSize="sm" color="gray.600">
              Sync your fitness activities from Google Fit automatically
            </Text>
            <HStack spacing={2}>
              <Button
                colorScheme="brand"
                onClick={syncGoogleFit}
                isLoading={syncing}
                loadingText="Syncing..."
              >
                Sync Now
              </Button>
              <Button
                variant="outline"
                colorScheme="red"
                size="sm"
                onClick={disconnectGoogleFit}
              >
                Disconnect
              </Button>
            </HStack>
          </>
        ) : (
          <>
            <Text fontSize="sm" color="gray.600">
              Connect Google Fit to automatically import your fitness activities
            </Text>
            <Button
              colorScheme="brand"
              onClick={connectGoogleFit}
              leftIcon={<span>🔗</span>}
            >
              Connect Google Fit
            </Button>
          </>
        )}
      </VStack>
    </Box>
  );
}
