import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { 
  Bell, 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Navigation,
  Phone,
  MessageCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DeliveryNotification {
  id: number;
  deliveryId: number;
  orderId: number;
  title: string;
  message: string;
  type: 'new_delivery' | 'pickup_reminder' | 'delivery_update' | 'payment_received';
  isRead: boolean;
  createdAt: string;
  deliveryDetails: {
    customerName: string;
    customerPhone: string;
    pickupAddress: string;
    deliveryAddress: string;
    deliveryFee: string;
    estimatedDistance: number;
    specialInstructions?: string;
  };
}

export default function DeliveryPartnerNotifications() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNotification, setSelectedNotification] = useState<DeliveryNotification | null>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/delivery-notifications', user?.id],
    enabled: !!user?.id,
  });

  const { data: activeDeliveries = [] } = useQuery({
    queryKey: ['/api/deliveries/active', user?.id],
    enabled: !!user?.id,
  });

  const acceptDeliveryMutation = useMutation({
    mutationFn: async (deliveryId: number) => {
      const response = await fetch(`/api/deliveries/${deliveryId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: user?.id }),
      });
      if (!response.ok) throw new Error('Failed to accept delivery');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/active'] });
      toast({
        title: "Delivery Accepted",
        description: "You have successfully accepted this delivery order.",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/delivery-notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-notifications'] });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ deliveryId, location }: { deliveryId: number; location: string }) => {
      return apiRequest(`/api/deliveries/${deliveryId}/location`, {
        method: 'PUT',
        body: { location },
      });
    },
    onSuccess: () => {
      toast({
        title: "Location Updated",
        description: "Your current location has been updated successfully.",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_delivery':
        return <Package className="h-5 w-5" />;
      case 'pickup_reminder':
        return <Clock className="h-5 w-5" />;
      case 'delivery_update':
        return <Navigation className="h-5 w-5" />;
      case 'payment_received':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_delivery':
        return "text-blue-600 bg-blue-50";
      case 'pickup_reminder':
        return "text-orange-600 bg-orange-50";
      case 'delivery_update':
        return "text-green-600 bg-green-50";
      case 'payment_received':
        return "text-emerald-600 bg-emerald-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Delivery Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with new delivery assignments and order updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <Navigation className="h-4 w-4 mr-2" />
            Update Location
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">
            Notifications ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Deliveries ({activeDeliveries.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Delivery History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                <p className="text-muted-foreground">
                  You'll receive notifications here when new deliveries are assigned to you
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {notifications.map((notification: any) => (
                <Card 
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                  }`}
                  onClick={() => {
                    setSelectedNotification(notification);
                    if (!notification.isRead) {
                      markAsReadMutation.mutate(notification.id);
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{notification.title}</h3>
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <Badge variant="secondary" className="text-xs">New</Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{notification.message}</p>
                        
                        {notification.deliveryDetails && (
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-red-500" />
                                <span className="font-medium">Pickup:</span>
                                <span className="text-muted-foreground">
                                  {notification.deliveryDetails.pickupAddress}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Delivery:</span>
                                <span className="text-muted-foreground">
                                  {notification.deliveryDetails.deliveryAddress}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="font-medium">Fee:</span>
                                <span className="text-green-600 font-semibold">
                                  ₹{notification.deliveryDetails.deliveryFee}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Navigation className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Distance:</span>
                                <span className="text-muted-foreground">
                                  {notification.deliveryDetails.estimatedDistance} km
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {notification.type === 'new_delivery' && (
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptDeliveryMutation.mutate(notification.deliveryId);
                              }}
                              disabled={acceptDeliveryMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept Delivery
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`tel:${notification.deliveryDetails.customerPhone}`);
                              }}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call Customer
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeDeliveries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No active deliveries</h3>
                <p className="text-muted-foreground">
                  Your active delivery orders will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeDeliveries.map((delivery: any) => (
                <Card key={delivery.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Order #{delivery.orderId}
                      </CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {delivery.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <span>Pickup: {delivery.pickupAddress}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span>Delivery: {delivery.deliveryAddress}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span>Fee: ₹{delivery.deliveryFee}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>Estimated: {delivery.estimatedTime} mins</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm">
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Customer
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Delivery History</CardTitle>
              <CardDescription>
                View your completed deliveries and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Delivery history will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}