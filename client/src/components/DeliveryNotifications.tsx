import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Phone, DollarSign, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryNotification {
  id: number;
  order_id: number;
  delivery_partner_id: number;
  status: string;
  notification_data: string;
  created_at: string;
  customername: string;
  totalamount: string;
  shippingaddress: string;
}

interface NotificationData {
  orderId: number;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDistance: number;
  estimatedEarnings: number;
  latitude: string;
  longitude: string;
}

export default function DeliveryNotifications({ deliveryPartnerId }: { deliveryPartnerId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [acceptingOrder, setAcceptingOrder] = useState<number | null>(null);
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    // Create notification sound using Web Audio API for better browser compatibility
    const createNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    };

    audioRef.current = { play: createNotificationSound } as any;
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/delivery-notifications", deliveryPartnerId],
    queryFn: async () => {
      const response = await fetch("/api/delivery-notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const allNotifications = await response.json();
      // Filter notifications for this specific delivery partner
      return allNotifications.filter((notification: DeliveryNotification) => 
        notification.delivery_partner_id === deliveryPartnerId && notification.status === 'pending'
      );
    },
    enabled: !!deliveryPartnerId,
    refetchInterval: 5000, // Poll every 5 seconds for new orders
  });

  // Play notification sound when new notifications arrive
  useEffect(() => {
    if (notifications.length > previousNotificationCount && previousNotificationCount > 0) {
      try {
        audioRef.current?.play();
        
        // Show toast notification for new delivery requests
        toast({
          title: "🚚 New Delivery Request!",
          description: `You have ${notifications.length - previousNotificationCount} new delivery request(s)`,
          duration: 5000,
        });
      } catch (error) {
        console.log("Could not play notification sound:", error);
      }
    }
    setPreviousNotificationCount(notifications.length);
  }, [notifications.length, previousNotificationCount, toast]);

  const acceptMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`/api/delivery-notifications/${orderId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryPartnerId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      return response.json();
    },
    onSuccess: (data, orderId) => {
      toast({
        title: "Order Accepted!",
        description: `You have successfully accepted order #${orderId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/active"] });
      setAcceptingOrder(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setAcceptingOrder(null);
    },
  });

  const handleAcceptOrder = (orderId: number) => {
    setAcceptingOrder(orderId);
    acceptMutation.mutate(orderId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Delivery Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading notifications...</div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Delivery Notifications
            <Badge variant="secondary">0</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No new delivery requests</p>
            <p className="text-sm">Checking for new orders every 5 seconds...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Delivery Notifications
          <Badge variant="default" className="bg-red-500 text-white animate-pulse">
            {notifications.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification: DeliveryNotification) => {
            let notificationData: NotificationData;
            try {
              notificationData = JSON.parse(notification.notification_data);
            } catch {
              notificationData = {
                orderId: notification.order_id,
                customerName: notification.customername || "Unknown Customer",
                customerPhone: "N/A",
                totalAmount: notification.totalamount || "0",
                pickupAddress: "Store Location",
                deliveryAddress: notification.shippingaddress || "Unknown Address",
                estimatedDistance: 5,
                estimatedEarnings: Math.round(parseFloat(notification.totalamount || "0") * 0.1),
                latitude: "0",
                longitude: "0"
              };
            }

            return (
              <Card key={notification.id} className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">Order #{notificationData.orderId}</h4>
                      <Badge variant="destructive" className="animate-pulse">
                        URGENT - FIRST ACCEPT FIRST SERVE
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ₹{notificationData.totalAmount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Earn: ₹{notificationData.estimatedEarnings}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium">{notificationData.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {notificationData.customerPhone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="text-sm font-medium">Distance</div>
                        <div className="text-sm text-muted-foreground">
                          ~{notificationData.estimatedDistance} km
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <div className="text-sm font-medium">Pickup</div>
                        <div className="text-sm text-muted-foreground">
                          {notificationData.pickupAddress}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-500 mt-1" />
                      <div>
                        <div className="text-sm font-medium">Delivery</div>
                        <div className="text-sm text-muted-foreground">
                          {notificationData.deliveryAddress}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptOrder(notification.order_id)}
                      disabled={acceptingOrder === notification.order_id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {acceptingOrder === notification.order_id ? (
                        "Accepting..."
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Accept Order - ₹{notificationData.estimatedEarnings}
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    Received: {new Date(notification.created_at).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}