import admin from 'firebase-admin';
import { storage } from './storage';

export interface FirebaseNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface FirebaseNotificationOptions {
  priority?: 'high' | 'normal';
  timeToLive?: number;
  collapseKey?: string;
  badge?: number;
  sound?: string;
}

export class FirebaseService {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    try {
      // Check if Firebase service account is configured
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (!serviceAccount) {
        console.log('Firebase service account not configured. Push notifications will be limited.');
        return;
      }

      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

      this.initialized = true;
      console.log('✅ Firebase service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase service:', error);
    }
  }

  static isConfigured(): boolean {
    return this.initialized && !!process.env.FIREBASE_SERVICE_ACCOUNT;
  }

  /**
   * Send notification to a specific device token
   */
  static async sendToDevice(
    token: string,
    payload: FirebaseNotificationPayload,
    options: FirebaseNotificationOptions = {}
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Firebase not configured. Cannot send push notification.');
      return false;
    }

    try {
      const message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: options.priority || 'high',
          ttl: options.timeToLive || 3600000, // 1 hour default
          collapseKey: options.collapseKey,
          notification: {
            sound: options.sound || 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            channelId: 'siraha_bazaar_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge || 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple devices
   */
  static async sendToMultipleDevices(
    tokens: string[],
    payload: FirebaseNotificationPayload,
    options: FirebaseNotificationOptions = {}
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.isConfigured()) {
      console.warn('Firebase not configured. Cannot send push notifications.');
      return { successCount: 0, failureCount: tokens.length };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: options.priority || 'high',
          ttl: options.timeToLive || 3600000,
          collapseKey: options.collapseKey,
          notification: {
            sound: options.sound || 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            channelId: 'siraha_bazaar_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge || 1,
            },
          },
        },
        tokens,
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log(`Successfully sent ${response.successCount} messages`);
      console.log(`Failed to send ${response.failureCount} messages`);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Error sending messages:', error);
      return { successCount: 0, failureCount: tokens.length };
    }
  }

  /**
   * Send notification to users by role
   */
  static async sendToUsersByRole(
    role: string,
    payload: FirebaseNotificationPayload,
    options: FirebaseNotificationOptions = {}
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      // Get all device tokens for users with the specified role
      const tokens = await storage.getDeviceTokensByRole(role);
      
      if (tokens.length === 0) {
        console.log(`No device tokens found for role: ${role}`);
        return { successCount: 0, failureCount: 0 };
      }

      return await this.sendToMultipleDevices(tokens, payload, options);
    } catch (error) {
      console.error('Error sending notifications by role:', error);
      return { successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Send order notification to customer
   */
  static async sendOrderNotification(
    userId: number,
    orderId: number,
    status: string,
    customMessage?: string
  ): Promise<boolean> {
    const statusMessages = {
      pending: 'Your order has been placed successfully!',
      processing: 'Your order is being prepared',
      shipped: 'Your order has been shipped',
      out_for_delivery: 'Your order is out for delivery',
      delivered: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled',
    };

    const payload: FirebaseNotificationPayload = {
      title: 'Order Update',
      body: customMessage || statusMessages[status] || `Order status: ${status}`,
      data: {
        type: 'order_update',
        orderId: orderId.toString(),
        status,
        userId: userId.toString(),
      },
    };

    try {
      const tokens = await storage.getDeviceTokensByUserId(userId);
      
      if (tokens.length === 0) {
        console.log(`No device tokens found for user: ${userId}`);
        return false;
      }

      const result = await this.sendToMultipleDevices(tokens, payload, { priority: 'high' });
      return result.successCount > 0;
    } catch (error) {
      console.error('Error sending order notification:', error);
      return false;
    }
  }

  /**
   * Send delivery assignment notification
   */
  static async sendDeliveryAssignmentNotification(
    deliveryPartnerId: number,
    orderId: number,
    pickupAddress: string,
    deliveryAddress: string
  ): Promise<boolean> {
    const payload: FirebaseNotificationPayload = {
      title: 'New Delivery Assignment',
      body: `New delivery from ${pickupAddress} to ${deliveryAddress}`,
      data: {
        type: 'delivery_assignment',
        orderId: orderId.toString(),
        deliveryPartnerId: deliveryPartnerId.toString(),
        pickupAddress,
        deliveryAddress,
      },
    };

    try {
      const tokens = await storage.getDeviceTokensByUserId(deliveryPartnerId);
      
      if (tokens.length === 0) {
        console.log(`No device tokens found for delivery partner: ${deliveryPartnerId}`);
        return false;
      }

      const result = await this.sendToMultipleDevices(tokens, payload, { 
        priority: 'high',
        sound: 'delivery_alert',
      });
      return result.successCount > 0;
    } catch (error) {
      console.error('Error sending delivery assignment notification:', error);
      return false;
    }
  }

  /**
   * Send promotional notification to customers
   */
  static async sendPromotionalNotification(
    title: string,
    message: string,
    imageUrl?: string,
    targetUserIds?: number[]
  ): Promise<{ successCount: number; failureCount: number }> {
    const payload: FirebaseNotificationPayload = {
      title,
      body: message,
      imageUrl,
      data: {
        type: 'promotion',
        timestamp: Date.now().toString(),
      },
    };

    try {
      let tokens: string[];
      
      if (targetUserIds && targetUserIds.length > 0) {
        // Send to specific users
        tokens = await storage.getDeviceTokensByUserIds(targetUserIds);
      } else {
        // Send to all customers
        tokens = await storage.getDeviceTokensByRole('customer');
      }

      if (tokens.length === 0) {
        console.log('No device tokens found for promotional notification');
        return { successCount: 0, failureCount: 0 };
      }

      return await this.sendToMultipleDevices(tokens, payload, { priority: 'normal' });
    } catch (error) {
      console.error('Error sending promotional notification:', error);
      return { successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Subscribe device token to topic
   */
  static async subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(`Successfully subscribed ${response.successCount} tokens to topic: ${topic}`);
      return response.successCount > 0;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  /**
   * Send notification to topic
   */
  static async sendToTopic(
    topic: string,
    payload: FirebaseNotificationPayload,
    options: FirebaseNotificationOptions = {}
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: options.priority || 'high',
          ttl: options.timeToLive || 3600000,
          notification: {
            sound: options.sound || 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            channelId: 'siraha_bazaar_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge || 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent topic message:', response);
      return true;
    } catch (error) {
      console.error('Error sending topic message:', error);
      return false;
    }
  }
}

// Initialize Firebase service
FirebaseService.initialize();

export default FirebaseService;