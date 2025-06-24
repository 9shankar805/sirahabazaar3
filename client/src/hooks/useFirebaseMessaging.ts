import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { apiRequest } from '@/lib/queryClient';

// Firebase configuration - Replace with your actual config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export interface UseFirebaseMessagingResult {
  token: string | null;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  saveTokenToServer: (userId: number) => Promise<boolean>;
}

export function useFirebaseMessaging(): UseFirebaseMessagingResult {
  const [token, setToken] = useState<string | null>(null);
  const [isSupportedState, setIsSupportedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    try {
      const supported = await isSupported();
      setIsSupportedState(supported);
      
      if (supported && hasFirebaseConfig()) {
        await initializeFirebase();
      } else if (!hasFirebaseConfig()) {
        setError('Firebase configuration not found. Please set up Firebase environment variables.');
      }
    } catch (err) {
      console.error('Error checking Firebase support:', err);
      setError('Firebase messaging is not supported in this browser');
    } finally {
      setIsLoading(false);
    }
  };

  const hasFirebaseConfig = () => {
    return !!(
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
    );
  };

  const initializeFirebase = async () => {
    try {
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // Show browser notification for foreground messages
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'Siraha Bazaar', {
            body: payload.notification?.body,
            icon: '/logo192.png',
            image: payload.notification?.imageUrl,
            data: payload.data,
          });
        }

        // Handle different notification types
        handleNotificationAction(payload.data);
      });

    } catch (err) {
      console.error('Error initializing Firebase:', err);
      setError('Failed to initialize Firebase messaging');
    }
  };

  const handleNotificationAction = (data: any) => {
    if (!data) return;

    // You can customize this based on your app's routing
    switch (data.type) {
      case 'order_update':
        // Navigate to order details
        console.log('Navigate to order:', data.orderId);
        break;
      case 'delivery_assignment':
        // Navigate to delivery dashboard
        console.log('Navigate to delivery:', data.orderId);
        break;
      case 'promotion':
        // Navigate to promotions
        console.log('Navigate to promotions');
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!isSupportedState || !hasFirebaseConfig()) {
        return false;
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await getFirebaseToken();
        return true;
      } else {
        setError('Notification permission denied');
        return false;
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to request notification permission');
      return false;
    }
  };

  const getFirebaseToken = async () => {
    try {
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (currentToken) {
        setToken(currentToken);
        console.log('Firebase token obtained:', currentToken);
      } else {
        setError('No registration token available');
      }
    } catch (err) {
      console.error('Error getting Firebase token:', err);
      setError('Failed to get Firebase token');
    }
  };

  const saveTokenToServer = async (userId: number): Promise<boolean> => {
    if (!token) {
      setError('No token available to save');
      return false;
    }

    try {
      await apiRequest('/api/device-token', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          token,
          deviceType: 'web',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Token saved to server successfully');
      return true;
    } catch (err) {
      console.error('Error saving token to server:', err);
      setError('Failed to save token to server');
      return false;
    }
  };

  return {
    token,
    isSupported: isSupportedState,
    isLoading,
    error,
    requestPermission,
    saveTokenToServer,
  };
}

// Hook for managing push notification setup
export function usePushNotificationSetup(userId?: number) {
  const messaging = useFirebaseMessaging();
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    if (userId && messaging.token && !isSetup) {
      setupPushNotifications();
    }
  }, [userId, messaging.token, isSetup]);

  const setupPushNotifications = async () => {
    if (!userId || !messaging.isSupported) return;

    try {
      const hasPermission = await messaging.requestPermission();
      
      if (hasPermission) {
        const success = await messaging.saveTokenToServer(userId);
        if (success) {
          setIsSetup(true);
          console.log('Push notifications setup completed');
        }
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  return {
    ...messaging,
    isSetup,
    setupPushNotifications,
  };
}