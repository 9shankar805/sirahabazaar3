import { useState, useEffect } from "react";
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
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Orders</h3>
          <p className="text-gray-600">New delivery requests will appear here automatically.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Delivery Orders</h2>
      
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
            pickupAddress: 'Store Address',
            deliveryAddress: notification.shippingaddress,
            estimatedDistance: 5,
            estimatedEarnings: 50,
            latitude: '0',
            longitude: '0'
          };
        }

        const isAccepting = acceptingOrder === notification.order_id;

        return (
          <Card key={notification.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Order #{notification.order_id}</CardTitle>
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(notification.created_at).toLocaleTimeString()}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Customer:</span>
                    <span>{notificationData.customerName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Phone:</span>
                    <span>{notificationData.customerPhone || 'Not provided'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Order Value:</span>
                    <span className="font-semibold text-green-600">Rs. {notificationData.totalAmount}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div>
                      <span className="font-medium block">Pickup:</span>
                      <span className="text-sm text-gray-600">{notificationData.pickupAddress}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div>
                      <span className="font-medium block">Delivery:</span>
                      <span className="text-sm text-gray-600">{notificationData.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex space-x-4 text-sm text-gray-600">
                  <span>Distance: ~{notificationData.estimatedDistance} km</span>
                  <span>Earnings: Rs. {notificationData.estimatedEarnings}</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectOrder(notification.order_id)}
                    disabled={isAccepting || rejectMutation.isPending}
                  >
                    Decline
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleAcceptOrder(notification.order_id)}
                    disabled={isAccepting || acceptMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isAccepting ? "Accepting..." : "Accept Order"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}