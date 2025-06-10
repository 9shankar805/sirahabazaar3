import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  MessageCircle,
  Truck,
  Camera,
  Star,
  Target,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryOrder {
  id: number;
  orderId: number;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryFee: number;
  estimatedDistance: number;
  estimatedTime: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  specialInstructions?: string;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

interface DeliveryPartnerStats {
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  todayDeliveries: number;
  todayEarnings: number;
  activeDeliveries: number;
}

export default function DeliveryPartnerTest() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("notifications");

  // Mock data for comprehensive testing
  const mockNotifications = [
    {
      id: 1,
      type: 'new_delivery',
      title: 'New Delivery Assignment',
      message: 'You have been assigned a new delivery order from Green Valley Restaurant',
      isRead: false,
      createdAt: new Date().toISOString(),
      orderId: 1001,
      deliveryDetails: {
        customerName: 'Rajesh Kumar',
        customerPhone: '+91 9876543210',
        pickupAddress: 'Green Valley Restaurant, Sector 14, Gurugram',
        deliveryAddress: 'Block A, DLF Phase 2, Gurugram',
        deliveryFee: 45,
        estimatedDistance: 3.2,
        specialInstructions: 'Ring the doorbell twice. Customer is on 3rd floor.'
      }
    },
    {
      id: 2,
      type: 'pickup_reminder',
      title: 'Pickup Reminder',
      message: 'Please pick up Order #1002 from Spice Garden within 10 minutes',
      isRead: false,
      createdAt: new Date(Date.now() - 300000).toISOString(),
      orderId: 1002,
      deliveryDetails: {
        customerName: 'Priya Sharma',
        customerPhone: '+91 9876543211',
        pickupAddress: 'Spice Garden, Cyber Hub, Gurugram',
        deliveryAddress: 'Golf Course Road, Gurugram',
        deliveryFee: 35,
        estimatedDistance: 2.8,
      }
    },
    {
      id: 3,
      type: 'payment_received',
      title: 'Payment Received',
      message: 'You have received ₹65 for Order #1000 delivery',
      isRead: true,
      createdAt: new Date(Date.now() - 900000).toISOString(),
      orderId: 1000,
    }
  ];

  const mockActiveDeliveries: DeliveryOrder[] = [
    {
      id: 1,
      orderId: 1001,
      customerName: 'Rajesh Kumar',
      customerPhone: '+91 9876543210',
      pickupAddress: 'Green Valley Restaurant, Sector 14, Gurugram',
      deliveryAddress: 'Block A, DLF Phase 2, Gurugram',
      deliveryFee: 45,
      estimatedDistance: 3.2,
      estimatedTime: 25,
      status: 'assigned',
      specialInstructions: 'Ring the doorbell twice. Customer is on 3rd floor.',
      assignedAt: new Date().toISOString(),
    },
    {
      id: 2,
      orderId: 1002,
      customerName: 'Priya Sharma',
      customerPhone: '+91 9876543211',
      pickupAddress: 'Spice Garden, Cyber Hub, Gurugram',
      deliveryAddress: 'Golf Course Road, Gurugram',
      deliveryFee: 35,
      estimatedDistance: 2.8,
      estimatedTime: 20,
      status: 'picked_up',
      assignedAt: new Date(Date.now() - 600000).toISOString(),
      pickedUpAt: new Date(Date.now() - 300000).toISOString(),
    }
  ];

  const mockStats: DeliveryPartnerStats = {
    totalDeliveries: 147,
    totalEarnings: 8950,
    rating: 4.8,
    todayDeliveries: 8,
    todayEarnings: 425,
    activeDeliveries: 2
  };

  const updateDeliveryStatus = (deliveryId: number, newStatus: string) => {
    toast({
      title: "Status Updated",
      description: `Delivery status updated to ${newStatus.replace('_', ' ')}`,
    });
  };

  const acceptDelivery = (orderId: number) => {
    toast({
      title: "Delivery Accepted",
      description: `You have accepted delivery for Order #${orderId}`,
    });
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'assigned': return 25;
      case 'picked_up': return 50;
      case 'in_transit': return 75;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'assigned': return 'bg-yellow-500';
      case 'picked_up': return 'bg-blue-500';
      case 'in_transit': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_delivery': return <Package className="h-5 w-5" />;
      case 'pickup_reminder': return <Clock className="h-5 w-5" />;
      case 'delivery_update': return <Navigation className="h-5 w-5" />;
      case 'payment_received': return <DollarSign className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_delivery': return "text-blue-600 bg-blue-50";
      case 'pickup_reminder': return "text-orange-600 bg-orange-50";
      case 'delivery_update': return "text-green-600 bg-green-50";
      case 'payment_received': return "text-emerald-600 bg-emerald-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Professional Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Delivery Partner Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Professional delivery management system
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Online
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Deliveries</p>
                  <p className="text-2xl font-bold">{mockStats.totalDeliveries}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{mockStats.totalEarnings}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    {mockStats.rating}
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  </p>
                </div>
                <Target className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today Deliveries</p>
                  <p className="text-2xl font-bold">{mockStats.todayDeliveries}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today Earnings</p>
                  <p className="text-2xl font-bold">₹{mockStats.todayEarnings}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Deliveries ({mockStats.activeDeliveries})
            </TabsTrigger>
            <TabsTrigger value="tracking">
              Live Tracking
            </TabsTrigger>
            <TabsTrigger value="earnings">
              Earnings & Reports
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            {mockNotifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                }`}
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
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-4">
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

                      {notification.deliveryDetails?.specialInstructions && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-yellow-800">Special Instructions</h4>
                              <p className="text-sm text-yellow-700">
                                {notification.deliveryDetails.specialInstructions}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {notification.type === 'new_delivery' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => acceptDelivery(notification.orderId)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept Delivery
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`tel:${notification.deliveryDetails?.customerPhone}`)}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Customer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedTab('tracking')}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            View Map
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Active Deliveries Tab */}
          <TabsContent value="active" className="space-y-4">
            {mockActiveDeliveries.map((delivery) => (
              <Card key={delivery.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order #{delivery.orderId}
                    </CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {delivery.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription>
                    Customer: {delivery.customerName} • Assigned {new Date(delivery.assignedAt).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Progress Indicator */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>{getStatusProgress(delivery.status)}% Complete</span>
                    </div>
                    <Progress value={getStatusProgress(delivery.status)} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Pickup:</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {delivery.pickupAddress}
                      </p>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Delivery:</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {delivery.deliveryAddress}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Fee:</span>
                        <span className="text-green-600 font-semibold">₹{delivery.deliveryFee}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Est. Time:</span>
                        <span className="text-muted-foreground">{delivery.estimatedTime} mins</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Navigation className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Distance:</span>
                        <span className="text-muted-foreground">{delivery.estimatedDistance} km</span>
                      </div>
                    </div>
                  </div>

                  {delivery.specialInstructions && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Special Instructions</h4>
                          <p className="text-sm text-yellow-700">{delivery.specialInstructions}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {delivery.status === 'assigned' && (
                      <Button 
                        size="sm"
                        onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Picked Up
                      </Button>
                    )}
                    
                    {delivery.status === 'picked_up' && (
                      <Button 
                        size="sm"
                        onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Start Delivery
                      </Button>
                    )}
                    
                    {delivery.status === 'in_transit' && (
                      <Button 
                        size="sm"
                        onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Delivered
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(delivery.deliveryAddress)}`)}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Navigate
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`tel:${delivery.customerPhone}`)}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Customer
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedTab('tracking')}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Track Live
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Live Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Live Delivery Tracking
                </CardTitle>
                <CardDescription>
                  Real-time location sharing and delivery progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Current Active Delivery</h4>
                    <p className="text-blue-700">Order #1001 - Rajesh Kumar</p>
                    <p className="text-sm text-blue-600">
                      Pickup: Green Valley Restaurant → Delivery: DLF Phase 2
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button className="h-12">
                      <Navigation className="h-5 w-5 mr-2" />
                      Share Live Location
                    </Button>
                    <Button variant="outline" className="h-12">
                      <Camera className="h-5 w-5 mr-2" />
                      Upload Proof
                    </Button>
                  </div>
                  
                  <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Interactive Map View</p>
                      <p className="text-sm text-gray-500">Real-time location tracking would appear here</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Deliveries:</span>
                      <span className="font-semibold">{mockStats.todayDeliveries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Earnings:</span>
                      <span className="font-semibold text-green-600">₹{mockStats.todayEarnings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg per delivery:</span>
                      <span className="font-semibold">₹{Math.round(mockStats.todayEarnings / mockStats.todayDeliveries)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Deliveries:</span>
                      <span className="font-semibold">52</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Earnings:</span>
                      <span className="font-semibold text-green-600">₹2,850</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <span className="font-semibold flex items-center gap-1">
                        {mockStats.rating}
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Deliveries:</span>
                      <span className="font-semibold">{mockStats.totalDeliveries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Earnings:</span>
                      <span className="font-semibold text-green-600">₹{mockStats.totalEarnings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Member Since:</span>
                      <span className="font-semibold">Jan 2024</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}