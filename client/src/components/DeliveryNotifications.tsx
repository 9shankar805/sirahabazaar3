import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Phone, DollarSign, Package, Bell } from "lucide-react";
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
  storename?: string;
  orderitems?: number;
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [acceptingOrder, setAcceptingOrder] = useState<number | null>(null);
  const [previousCount, setPreviousCount] = useState(0);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/delivery-notifications", deliveryPartnerId],
    queryFn: async () => {
      const response = await fetch("/api/delivery-notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const allNotifications = await response.json();
      console.log('All delivery notifications:', allNotifications);

      // Show all available orders (not filtered by delivery partner)
      return allNotifications.filter((notification: DeliveryNotification) => 
        notification.status === 'pending'
      );
    },
    enabled: !!deliveryPartnerId,
    refetchInterval: 3000, // Poll every 3 seconds for new orders
  });

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
        title: "Failed to Accept Order",
        description: error.message,
        variant: "destructive",
      });
      setAcceptingOrder(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`/api/delivery-notifications/${orderId}/reject`, {
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
        title: "Order Rejected",
        description: `You have rejected order #${orderId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Reject Order",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Play notification sound when new orders arrive
  useEffect(() => {
    if (notifications.length > previousCount && previousCount > 0) {
      // Play notification sound
      try {
        const audio = new Audio('data:audio/wav;base64,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');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Fallback to system notification
          if (Notification.permission === 'granted') {
            new Notification('New Delivery Order Available!', {
              body: 'Check your dashboard for new delivery opportunities',
              icon: '/icons/delivery-icon.png'
            });
          }
        });
      } catch (error) {
        console.log('Could not play notification sound');
      }

      toast({
        title: "🚚 New Orders Available!",
        description: `${notifications.length - previousCount} new delivery order${notifications.length - previousCount > 1 ? 's' : ''} available`,
        duration: 5000,
      });
    }
    setPreviousCount(notifications.length);
  }, [notifications.length, previousCount, toast]);

  const handleAcceptOrder = (orderId: number) => {
    setAcceptingOrder(orderId);
    acceptMutation.mutate(orderId);
  };

  const handleRejectOrder = (orderId: number) => {
    rejectMutation.mutate(orderId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="shadow-lg border-0 h-full">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            <span className="text-sm sm:text-base">New Assignments ({notifications.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-96 overflow-y-auto px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="text-center py-6 sm:py-8">
            <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-500">No new assignments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 h-full">
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
          <span className="text-sm sm:text-base">New Assignments ({notifications.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-96 overflow-y-auto px-3 sm:px-6 pb-3 sm:pb-6">
        {notifications.map((notification: DeliveryNotification) => {
          let notificationData: NotificationData;
          try {
            notificationData = JSON.parse(notification.notification_data);
          } catch {
            notificationData = {
              orderId: notification.order_id,
              customerName: notification.customername,
              customerPhone: '',
              totalAmount: notification.totalamount,
              pickupAddress: notification.storename || 'Store Address',
              deliveryAddress: notification.shippingaddress,
              estimatedDistance: Math.floor(Math.random() * 10) + 2, // 2-12 km
              estimatedEarnings: Math.floor(parseFloat(notification.totalamount) * 0.15) + 25, // 15% + base fee
              latitude: '0',
              longitude: '0',
              orderItems: notification.orderitems || 1,
              deliveryFee: Math.floor(parseFloat(notification.totalamount) * 0.1) + 30 // 10% + base
            };
          }

          const isAccepting = acceptingOrder === notification.order_id;

          const isUrgent = notificationData.urgent || notificationData.estimatedDistance > 8;

          return (
            <Card key={notification.id} className="border border-orange-200 bg-orange-50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-2">
                  <div className="font-semibold text-sm sm:text-lg">
                    Order #{notification.order_id}
                  </div>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs w-fit">
                    New Assignment
                  </Badge>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                    <span className="font-medium">Customer:</span>
                    <span className="text-gray-700 truncate">{notification.customername}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    <span className="font-medium">Order Total:</span>
                    <span className="text-gray-700">₹{notification.totalamount}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">Delivery Address:</span>
                      <p className="text-gray-700 text-[10px] sm:text-xs mt-1 break-words">{notification.shippingaddress}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium">Assigned:</span>
                    <span className="text-gray-700 text-[10px] sm:text-xs">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4">
                  <Button
                    onClick={() => acceptAssignment.mutate(notification.id)}
                    disabled={acceptAssignment.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-2"
                    size="sm"
                  >
                    Accept Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}