// Service Worker for Push Notifications
const CACHE_NAME = 'siraha-bazaar-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Handle push events
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.message || data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image: data.image,
    tag: data.tag || 'siraha-notification',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Siraha Bazaar', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data;
  let url = '/';
  
  // Determine URL based on notification type
  if (data.orderId) {
    url = `/orders/${data.orderId}`;
  } else if (data.productId) {
    url = `/products/${data.productId}`;
  } else if (data.storeId) {
    url = `/stores/${data.storeId}`;
  } else if (data.url) {
    url = data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Optional: Track notification dismissal
  const data = event.notification.data;
  if (data.trackDismissal) {
    // Send analytics or tracking data
    fetch('/api/notifications/track-dismissal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: data.id,
        dismissedAt: new Date().toISOString()
      })
    }).catch(err => console.log('Failed to track dismissal:', err));
  }
});

// Handle background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // Fetch pending notifications when back online
    const response = await fetch('/api/notifications/pending');
    const notifications = await response.json();
    
    for (const notification of notifications) {
      await self.registration.showNotification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        data: notification.data
      });
    }
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}