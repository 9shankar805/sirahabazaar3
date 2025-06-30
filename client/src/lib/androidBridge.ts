// Android Bridge for Firebase token management
export class AndroidBridge {
  
  // Check if running in Android WebView
  static isAndroidApp(): boolean {
    return !!(window as any).AndroidApp;
  }
  
  // Update FCM token when received from Android
  static setupTokenReceiver() {
    if (this.isAndroidApp()) {
      (window as any).updateFCMToken = async (token: string) => {
        console.log('Received FCM token from Android:', token);
        
        try {
          // Send token to your server
          const response = await fetch('/api/firebase-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              token,
              platform: 'android',
              timestamp: new Date().toISOString()
            }),
          });
          
          if (response.ok) {
            console.log('Token successfully sent to server');
            this.showToast('Notifications enabled successfully!');
          } else {
            console.error('Failed to send token to server');
          }
        } catch (error) {
          console.error('Error sending token to server:', error);
        }
      };
    }
  }
  
  // Show Android toast message
  static showToast(message: string) {
    if (this.isAndroidApp() && (window as any).AndroidApp) {
      (window as any).AndroidApp.showToast(message);
    }
  }
  
  // Request notification permission on Android
  static requestNotificationPermission() {
    if (this.isAndroidApp() && (window as any).AndroidApp) {
      (window as any).AndroidApp.requestNotificationPermission();
    }
  }
  
  // Handle notification data from Android intent
  static handleNotificationIntent() {
    if (this.isAndroidApp()) {
      // Check URL parameters for notification data
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const orderId = urlParams.get('orderId');
      
      if (action && orderId) {
        this.handleNotificationAction(action, orderId);
      }
    }
  }
  
  // Handle specific notification actions
  private static handleNotificationAction(action: string, orderId: string) {
    switch (action) {
      case 'view_order':
        // Navigate to order tracking page
        window.location.href = `/track-order?orderId=${orderId}`;
        break;
      case 'accept_delivery':
        // Navigate to delivery dashboard
        window.location.href = `/delivery-dashboard?acceptOrder=${orderId}`;
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }
  
  // Initialize Android bridge
  static initialize() {
    if (this.isAndroidApp()) {
      console.log('Initializing Android bridge');
      this.setupTokenReceiver();
      this.handleNotificationIntent();
      
      // Auto-request notification permission
      setTimeout(() => {
        this.requestNotificationPermission();
      }, 2000);
    }
  }
}