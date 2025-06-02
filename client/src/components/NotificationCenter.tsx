import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Package, ShoppingCart, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

interface NotificationCenterProps {
  userId: number;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/notifications/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Failed to mark notification as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/user", userId] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/user/${userId}/read-all`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Failed to mark all notifications as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/user", userId] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "error":
        return "text-red-600 bg-red-50";
      case "info":
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  const displayNotifications = showAll ? notifications : notifications?.slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading notifications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
        <CardDescription>
          Stay updated with your orders and account activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No notifications yet</p>
            <p className="text-sm">You'll see updates about your orders and activities here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayNotifications?.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors ${
                  notification.isRead
                    ? "bg-gray-50 border-gray-200"
                    : "bg-white border-blue-200 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`font-medium ${notification.isRead ? "text-gray-700" : "text-gray-900"}`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${notification.isRead ? "text-gray-500" : "text-gray-600"}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {notification.orderId && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Order #{notification.orderId}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {notifications && notifications.length > 5 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Show Less" : `Show All (${notifications.length})`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}