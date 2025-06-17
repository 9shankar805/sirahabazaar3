
import React, { useState, useEffect, useMemo } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  orderId?: number;
  productId?: number;
  data?: string;
}

const MobileNotificationBar: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Always call hooks at the top level - no conditional hooks
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/notifications/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
        setLastFetchTime(Date.now());
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err) {
      setError('Network error');
      console.error('Notification fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/notifications/user/${user.id}/read-all`, {
        method: 'PUT',
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'offer': return <Gift className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const playNotificationSound = () => {
    if (soundEnabled) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio play errors (autoplay restrictions)
        });
      } catch (err) {
        // Ignore audio errors
      }
    }
  };

  // Effects
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const prevCount = notifications.filter(n => !n.isRead).length;
    if (prevCount > 0 && unreadCount > prevCount) {
      playNotificationSound();
    }
  }, [unreadCount]);

  // Don't render if no user
  if (!user?.id) {
    return null;
  }

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <Button
          size="sm"
          variant="outline"
          className="relative bg-white shadow-lg border-gray-200 hover:bg-gray-50"
          onClick={() => setIsVisible(!isVisible)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      {isVisible && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setIsVisible(false)} />
          <div className="absolute top-16 right-4 left-4 max-h-[80vh] bg-white rounded-lg shadow-xl border">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button size="sm" variant="ghost" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">Loading notifications...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <p className="text-sm text-red-600">{error}</p>
                  <Button size="sm" variant="outline" onClick={fetchNotifications} className="mt-2">
                    Try Again
                  </Button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.slice(0, 20).map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t bg-gray-50 text-center">
                <p className="text-xs text-gray-500">
                  Showing {Math.min(notifications.length, 20)} of {notifications.length} notifications
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNotificationBar;
