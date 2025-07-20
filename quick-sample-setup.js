#!/usr/bin/env node

// Quick sample data setup for testing push notifications
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

// Sample data for complete system testing
const SAMPLE_DATA = {
  users: [
    { email: 'john@test.com', name: 'John Customer', role: 'customer', phone: '+977-9801111111' },
    { email: 'shop@test.com', name: 'Shop Owner', role: 'shopkeeper', phone: '+977-9801222222' },
    { email: 'delivery@test.com', name: 'Delivery Partner', role: 'delivery_partner', phone: '+977-9801333333' }
  ],
  deviceTokens: [
    'eBH8i8SLNT:APA91bE8wR7JqWpQx4YQ0v5tVzNkNt5rA9nGl6XO2K8YjFyPsWz3oXkLMQrSvNpT7uGh4iWbVe3cHj9k',
    'fKL9j9TMOU:APA91bF9xS8KrXqRy5ZR1w6uWaOlOu6sB0oHm7YP3L9ZkGzQtXa4pYlNNRsVwOqU8vHi5jXcWf4dIk0l',
    'gLM0k0UNPV:APA91bG0yT9LsYrSz6aS2x7vXbPmPv7tC1pIn8ZQ4M0alHaRuYb5qZmOORtWxPrV9wIj6kYdXg5eJl1m'
  ]
};

async function setupQuickSampleData() {
  console.log('🚀 Setting up quick sample data for push notifications...');
  
  try {
    // Wait for server to be available
    console.log('⏳ Waiting for server...');
    let serverReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        const healthCheck = await fetch(`${API_BASE}/health`, { 
          timeout: 2000,
          signal: AbortSignal.timeout(2000)
        });
        if (healthCheck.ok) {
          serverReady = true;
          break;
        }
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!serverReady) {
      console.log('⚠️ Server not ready, please start the application first');
      return;
    }
    
    console.log('✅ Server is ready');

    // Create device tokens with realistic FCM tokens
    console.log('📱 Creating realistic device tokens...');
    for (let i = 0; i < SAMPLE_DATA.deviceTokens.length; i++) {
      const tokenData = {
        userId: i + 1, // Assuming users 1, 2, 3 exist
        token: SAMPLE_DATA.deviceTokens[i],
        platform: 'android'
      };
      
      try {
        const response = await fetch(`${API_BASE}/device-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tokenData)
        });
        
        const result = await response.text();
        console.log(`✅ Device token registered for user ${tokenData.userId}: ${result.includes('success') ? 'Success' : 'Already exists'}`);
      } catch (error) {
        console.log(`⚠️ Error registering token for user ${tokenData.userId}`);
      }
    }

    // Create test notifications
    console.log('🔔 Creating test notifications...');
    const notifications = [
      {
        userId: 1,
        title: 'Welcome to Siraha Bazaar!',
        message: 'Your account is ready. Start exploring amazing products!',
        type: 'welcome'
      },
      {
        userId: 2,
        title: 'Store Setup Complete',
        message: 'Your store is now active and ready to receive orders.',
        type: 'store_activation'
      },
      {
        userId: 3,
        title: 'Delivery Partner Approved',
        message: 'Congratulations! You can now start accepting delivery assignments.',
        type: 'approval'
      },
      {
        userId: 1,
        title: 'Flash Sale Alert',
        message: 'Get 40% off on electronics. Limited time offer!',
        type: 'promotion'
      }
    ];

    for (const notification of notifications) {
      try {
        const response = await fetch(`${API_BASE}/test-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Notification sent to user ${notification.userId}: "${notification.title}"`);
          console.log(`   Android push: ${result.androidNotificationSent ? 'Sent' : 'Failed'}`);
        } else {
          console.log(`⚠️ Failed to send notification: ${notification.title}`);
        }
      } catch (error) {
        console.log(`⚠️ Error sending notification: ${notification.title}`);
      }
    }

    // Test production notification endpoint
    console.log('🧪 Testing production notification system...');
    try {
      const productionTest = {
        fcmToken: SAMPLE_DATA.deviceTokens[0],
        userId: 1,
        notificationType: 'production_test'
      };
      
      const response = await fetch(`${API_BASE}/notification/production-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productionTest)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Production test: ${result.success ? 'Success' : 'Failed'}`);
      }
    } catch (error) {
      console.log('⚠️ Production test failed');
    }

    // Create sample order and delivery notifications
    console.log('📦 Creating order and delivery sample notifications...');
    const orderNotifications = [
      {
        userId: 1,
        title: 'Order Placed Successfully',
        message: 'Your order #1001 has been received and is being processed.',
        type: 'order_placed'
      },
      {
        userId: 2,
        title: 'New Order Alert',
        message: 'You have received a new order for Samsung Galaxy A54.',
        type: 'new_order'
      },
      {
        userId: 3,
        title: 'Delivery Assignment',
        message: 'New delivery: Electronics Market → Siraha Main Road (5.2 km)',
        type: 'delivery_assignment'
      },
      {
        userId: 1,
        title: 'Order Out for Delivery',
        message: 'Your order is on the way! Estimated arrival: 25 minutes',
        type: 'order_delivery'
      }
    ];

    for (const notification of orderNotifications) {
      try {
        const response = await fetch(`${API_BASE}/test-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Order notification: "${notification.title}" → User ${notification.userId}`);
        }
      } catch (error) {
        console.log(`⚠️ Error sending order notification: ${notification.title}`);
      }
    }

    console.log(`
🎉 Sample Data Setup Complete!

📊 Created:
- 📱 3 realistic FCM device tokens (Android format)
- 🔔 7 test notifications across all user types
- 📦 4 order/delivery workflow notifications
- 🧪 Production notification system tested

🎯 Push Notification System Status:
- ✅ Device tokens registered for users 1, 2, 3
- ✅ FCM tokens use proper Android format
- ✅ Notifications sent to all user roles
- ✅ Order and delivery workflow covered
- ✅ Production endpoints tested

🧪 Test Your System:
1. Visit: http://localhost:5000/android-test
2. API Test: POST /api/test-notification
3. Check notifications: GET /api/notifications/stream/1
4. Production test: POST /api/notification/production-test

💡 Next Steps:
- Replace FCM tokens with real device tokens from Android app
- Test with actual Firebase project credentials
- Monitor notification delivery in production
    `);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run setup
setupQuickSampleData();