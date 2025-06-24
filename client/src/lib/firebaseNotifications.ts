// Firebase notification helper for mobile browsers
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCUDoNuJ5hUKzwnZJe8hp5Rbt_Ja1MCDpw",
  authDomain: "sirahabazaar-bc62f.firebaseapp.com",
  projectId: "sirahabazaar-bc62f",
  storageBucket: "sirahabazaar-bc62f.firebasestorage.app",
  messagingSenderId: "898667729116",
  appId: "1:898667729116:web:bf417c13c2651c0bc26419",
  measurementId: "G-SK3VBMNR5N"
};

const vapidKey = "BIA9pygwkacYkvg7W5lJh1PjDXhb2ntG3N0YCg9hbnNKwPHKncZlUzpRlNUZ4mOs-qQ_BgaFrSqDxKShgyWg-14";

let app: any = null;
let messaging: any = null;

export const initializeFirebaseNotifications = async () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
    }
    
    if (!messaging && 'serviceWorker' in navigator) {
      messaging = getMessaging(app);
      
      // Register service worker
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Firebase service worker registered');
    }
    
    return { app, messaging };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
};

export const requestNotificationPermission = async () => {
  try {
    if (Notification.permission === 'granted') {
      return true;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const getFirebaseToken = async () => {
  try {
    await initializeFirebaseNotifications();
    
    if (!messaging) {
      throw new Error('Firebase messaging not initialized');
    }
    
    const token = await getToken(messaging, { vapidKey });
    console.log('Firebase token obtained:', token);
    return token;
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    throw error;
  }
};

export const saveDeviceToken = async (userId: number, token: string) => {
  try {
    const response = await fetch('/api/device-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        token,
        deviceType: 'web',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save token: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving device token:', error);
    throw error;
  }
};

export const setupForegroundMessageListener = (callback?: (payload: any) => void) => {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // Show notification manually for foreground messages
    if (Notification.permission === 'granted') {
      const notification = new Notification(
        payload.notification?.title || 'Siraha Bazaar',
        {
          body: payload.notification?.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          image: payload.notification?.image,
          data: payload.data,
          tag: payload.data?.type || 'general',
          requireInteraction: false,
          silent: false,
          vibrate: [200, 100, 200],
        }
      );
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (callback) callback(payload);
      };
      
      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
    
    if (callback) callback(payload);
  });
};

export const testNotificationSetup = async (userId: number) => {
  try {
    // 1. Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      throw new Error('Notification permission not granted');
    }
    
    // 2. Initialize Firebase
    await initializeFirebaseNotifications();
    
    // 3. Get token
    const token = await getFirebaseToken();
    if (!token) {
      throw new Error('Failed to get Firebase token');
    }
    
    // 4. Save token to server
    await saveDeviceToken(userId, token);
    
    // 5. Setup message listener
    setupForegroundMessageListener((payload) => {
      console.log('Test notification received:', payload);
    });
    
    // 6. Send test notification
    const response = await fetch('/api/test-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title: 'Push Notifications Enabled!',
        message: 'You will now receive notifications from Siraha Bazaar',
        type: 'setup_test',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send test notification');
    }
    
    return true;
  } catch (error) {
    console.error('Error testing notification setup:', error);
    throw error;
  }
};

// Mobile-specific notification utilities
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const supportsNotifications = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

export const showManualNotification = (title: string, body: string, options: any = {}) => {
  if (!supportsNotifications() || Notification.permission !== 'granted') {
    return false;
  }
  
  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: isMobileDevice() ? [200, 100, 200] : undefined,
    ...options,
  });
  
  // Auto close after 5 seconds
  setTimeout(() => notification.close(), 5000);
  
  return true;
};