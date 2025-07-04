import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { Truck, Package, DollarSign, Clock, MapPin, CheckCircle, Star, Bell, TrendingUp, Calendar, Navigation, Phone, AlertCircle, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import DeliveryNotifications from "@/components/DeliveryNotifications";
import DeliveryPartnerProfileSetup from "@/components/DeliveryPartnerProfileSetup";
import DeliveryMap from "@/components/DeliveryMap";

import SoundTestButton from "@/components/SoundTestButton";

// Timer component for delivery time tracking
const DeliveryTimer = ({ createdAt, estimatedTime }: { createdAt: string; estimatedTime: number }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(createdAt);
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000 / 60); // minutes
      setElapsedTime(elapsed);
      setIsOverdue(elapsed > estimatedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, estimatedTime]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const remainingTime = Math.max(0, estimatedTime - elapsedTime);
  const progress = Math.min(100, (elapsedTime / estimatedTime) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <Timer className="h-3 w-3" />
          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
            {formatTime(elapsedTime)} elapsed
          </span>
        </div>
        <div className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-green-600'}`}>
          {isOverdue ? 'Overdue' : `${formatTime(remainingTime)} left`}
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all duration-1000 ${
            isOverdue ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 text-center">
        Target: {formatTime(estimatedTime)} | Status: {isOverdue ? 'Behind Schedule' : 'On Track'}
      </div>
    </div>
  );
};

interface DeliveryPartner {
  id: number;
  userId: number;
  vehicleType: string;
  vehicleNumber: string;
  drivingLicense: string;
  idProofType: string;
  idProofNumber: string;
  deliveryAreas: string[];
  emergencyContact: string;
  bankAccountNumber: string;
  ifscCode: string;
  status: string;
  isAvailable: boolean;
  currentLocation: string | null;
  totalDeliveries: number;
  totalEarnings: string;
  rating: number | null;
  createdAt: string;
}

interface Delivery {
  id: number;
  orderId: number;
  deliveryFee: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDistance: number;
  status: string;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  customerFeedback: string | null;
  customerRating: number | null;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: string;
}

interface DeliveryPartnerStats {
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  todayDeliveries: number;
  todayEarnings: number;
  activeDeliveries: number;
}

export default function DeliveryPartnerDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const { data: partner, isLoading: partnerLoading, error: partnerError } = useQuery({
    queryKey: ['/api/delivery-partners/user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/delivery-partners/user?userId=${user?.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch partner data');
      }
      return response.json();
    },
    enabled: !!user?.id,
    retry: 2,
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/deliveries/partner', partner?.id],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries/partner/${partner?.id}`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!partner?.id,
  });

  const { data: activeDeliveriesData = [], isLoading: activeDeliveriesLoading } = useQuery({
    queryKey: ['/api/deliveries/active', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries/active/${user?.id}`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh active deliveries every 5 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/delivery-partners/stats', partner?.id],
    queryFn: async () => {
      const response = await fetch(`/api/delivery-partners/${partner?.id}/stats`);
      if (!response.ok) {
        return {
          totalDeliveries: partner?.totalDeliveries || 0,
          totalEarnings: parseFloat(partner?.totalEarnings || '0'),
          rating: partner?.rating ? parseFloat(partner.rating.toString()) : 0,
          todayDeliveries: 0,
          todayEarnings: 0,
          activeDeliveries: Array.isArray(deliveries) ? deliveries.filter((d: Delivery) => ['assigned', 'picked_up'].includes(d.status)).length : 0
        };
      }
      return response.json();
    },
    enabled: !!partner?.id,
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ deliveryId, status }: { deliveryId: number; status: string }) => {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, partnerId: partner?.id }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/partner'] });
      toast({
        title: "Status Updated",
        description: "Delivery status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update delivery status.",
        variant: "destructive",
      });
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      const response = await fetch(`/api/delivery-partners/${partner?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-partners/user'] });
      toast({
        title: "Availability Updated",
        description: "Your availability status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update delivery status.",
        variant: "destructive",
      });
    },
  });

  if (partnerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-blue-600 mx-auto mb-4 sm:mb-6"></div>
          <h2 className="text-lg sm:text-2xl font-semibold text-gray-700 mb-2">Loading Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-500">Please wait while we fetch your information...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return <DeliveryPartnerProfileSetup userId={user?.id || 0} />;
  }

  const deliveriesArray = Array.isArray(deliveries) ? deliveries : [];
  const activeDeliveriesArray = Array.isArray(activeDeliveriesData) ? activeDeliveriesData : [];
  const pendingDeliveries = deliveriesArray.filter((d: Delivery) => d.status === 'assigned');
  const completedDeliveries = deliveriesArray.filter((d: Delivery) => d.status === 'delivered');

  const currentStats = stats || {
    totalDeliveries: partner?.totalDeliveries || 0,
    totalEarnings: parseFloat(partner?.totalEarnings || '0'),
    rating: partner?.rating ? parseFloat(partner.rating.toString()) : 0,
    todayDeliveries: 0,
    todayEarnings: 0,
    activeDeliveries: activeDeliveriesArray.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Mobile Responsive Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full">
                <Truck className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Delivery Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600 truncate">Welcome back, {user?.fullName}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <Badge 
                variant={partner.isAvailable ? "default" : "secondary"}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium ${
                  partner.isAvailable 
                    ? "bg-green-100 text-green-800 border-green-200" 
                    : "bg-gray-100 text-gray-800 border-gray-200"
                }`}
              >
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-2 ${
                  partner.isAvailable ? "bg-green-500" : "bg-gray-400"
                }`}></div>
                {partner.isAvailable ? "Online" : "Offline"}
              </Badge>
              <Button
                variant={partner.isAvailable ? "outline" : "default"}
                onClick={() => toggleAvailability.mutate(!partner.isAvailable)}
                disabled={toggleAvailability.isPending}
                className={`text-xs sm:text-sm px-3 sm:px-4 py-2 ${partner.isAvailable 
                  ? "border-red-200 text-red-600 hover:bg-red-50" 
                  : "bg-green-600 hover:bg-green-700 text-white"
                }`}
                size="sm"
              >
                {partner.isAvailable ? "Go Offline" : "Go Online"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          {/* Mobile Responsive Tabs - Clear Icons with Better Visibility */}
          <TabsList className="grid grid-cols-6 mb-4 sm:mb-8 bg-white shadow-sm h-auto p-1">
            <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center py-2 px-1 gap-1" title="Dashboard">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <span className="text-[10px] font-medium text-gray-600">Home</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex flex-col items-center justify-center py-2 px-1 gap-1 relative" title="Notifications">
              <div className="relative">
                <Bell className="h-6 w-6 text-orange-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <span className="text-[10px] font-medium text-gray-600">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="flex flex-col items-center justify-center py-2 px-1 gap-1 relative" title="Active Deliveries">
              <div className="relative">
                <Truck className="h-6 w-6 text-green-600" />
                {(pendingDeliveries.length + activeDeliveriesArray.length) > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">{pendingDeliveries.length + activeDeliveriesArray.length}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-gray-600">Active</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col items-center justify-center py-2 px-1 gap-1" title="Delivery History">
              <MapPin className="h-6 w-6 text-purple-600" />
              <span className="text-[10px] font-medium text-gray-600">Track</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex flex-col items-center justify-center py-2 px-1 gap-1" title="Earnings">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-[10px] font-medium text-gray-600">Earn</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col items-center justify-center py-2 px-1 gap-1" title="Reports">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <span className="text-[10px] font-medium text-gray-600">Report</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            {/* Mobile Responsive Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Total Deliveries</CardTitle>
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xl sm:text-3xl font-bold">{currentStats.totalDeliveries}</div>
                  <p className="text-[10px] sm:text-xs opacity-80 mt-1">
                    +{currentStats.todayDeliveries} today
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xl sm:text-3xl font-bold">₹{currentStats.totalEarnings.toFixed(2)}</div>
                  <p className="text-[10px] sm:text-xs opacity-80 mt-1">
                    +₹{currentStats.todayEarnings.toFixed(2)} today
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Active Deliveries</CardTitle>
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xl sm:text-3xl font-bold">{currentStats.activeDeliveries}</div>
                  <p className="text-[10px] sm:text-xs opacity-80 mt-1">
                    {pendingDeliveries.length} pending, {activeDeliveriesArray.length} in progress
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium opacity-90">Rating</CardTitle>
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-xl sm:text-3xl font-bold">
                    {currentStats.rating > 0 ? `${currentStats.rating.toFixed(1)}★` : "N/A"}
                  </div>
                  <p className="text-[10px] sm:text-xs opacity-80 mt-1">
                    Based on customer feedback
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Responsive Quick Actions */}
            <Card className="shadow-lg border-0">
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
                <CardDescription className="text-sm">Common tasks and notifications</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <Button className="h-12 sm:h-16 flex flex-col gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Notifications</span>
                  </Button>
                  <Button variant="outline" className="h-12 sm:h-16 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Navigation className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Navigation</span>
                  </Button>
                  <Button variant="outline" className="h-12 sm:h-16 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Support</span>
                  </Button>
                  <Button variant="outline" className="h-12 sm:h-16 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

      <SoundTestButton />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Mobile Responsive Map Section */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0">
                  <CardHeader className="px-3 sm:px-6">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-base sm:text-lg">Delivery Area Map</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">
                        Live
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="w-full h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center">
                      <div className="text-center p-4 sm:p-8 max-w-sm">
                        <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Interactive Map</h3>
                        <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">
                          Real-time delivery tracking and navigation
                        </p>
                        <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                            <span>Pickup Locations</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                            <span>Delivery Destinations</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                            <span>Your Location</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open('https://www.google.com/maps', '_blank')}
                            className="text-xs sm:text-sm"
                          >
                            <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Open Maps
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition((position) => {
                                  toast({
                                    title: "Location Updated",
                                    description: "Your current location has been recorded.",
                                  });
                                });
                              }
                            }}
                            className="text-xs sm:text-sm"
                          >
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Update Location
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Responsive Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
                      <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">{partner.deliveryAreas.length}</div>
                        <div className="text-xs sm:text-sm text-green-700">Coverage Areas</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{currentStats.activeDeliveries}</div>
                        <div className="text-xs sm:text-sm text-blue-700">Active Routes</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-orange-600">
                          {partner.isAvailable ? "Online" : "Offline"}
                        </div>
                        <div className="text-xs sm:text-sm text-orange-700">Status</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Responsive Notifications Panel */}
              <div className="lg:col-span-1">
                <div className="h-full">
                  <DeliveryNotifications deliveryPartnerId={partner?.id || 0} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 sm:space-y-6">
            {/* Delivery Notifications - Alerts Tab */}
            <Card className="shadow-lg border-0">
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  Delivery Alerts
                </CardTitle>
                <CardDescription className="text-sm">New delivery opportunities available</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <DeliveryNotifications deliveryPartnerId={partner?.id || 0} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Mobile Responsive Pending Deliveries */}
              <Card className="shadow-lg border-0">
                <CardHeader className="px-3 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    Pending Deliveries ({pendingDeliveries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                  {pendingDeliveries.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-gray-500">No pending deliveries</p>
                    </div>
                  ) : (
                    pendingDeliveries.map((delivery: Delivery) => (
                      <Card key={delivery.id} className="border border-orange-200 bg-orange-50 max-w-full overflow-hidden">
                        <CardContent className="p-2 sm:p-4">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="font-semibold text-xs sm:text-lg truncate min-w-0">Order #{delivery.orderId}</div>
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs flex-shrink-0">
                              ₹{delivery.deliveryFee}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-xs sm:text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs sm:text-sm">Pickup</p>
                                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 word-wrap break-words overflow-wrap-anywhere">{delivery.pickupAddress}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs sm:text-sm">Delivery</p>
                                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 word-wrap break-words overflow-wrap-anywhere">{delivery.deliveryAddress}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
                            <Button
                              onClick={() => updateDeliveryStatus.mutate({ deliveryId: delivery.id, status: 'picked_up' })}
                              disabled={updateDeliveryStatus.isPending}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-xs py-2"
                              size="sm"
                            >
                              <span className="hidden sm:inline">Accept & Pickup</span>
                              <span className="sm:hidden">Accept</span>
                            </Button>
                            <Button variant="outline" size="sm" className="sm:w-auto">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Mobile Responsive Active Deliveries */}
              <Card className="shadow-lg border-0">
                <CardHeader className="px-3 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    Active Deliveries ({activeDeliveriesArray.length})
                    {activeDeliveriesLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                  {activeDeliveriesLoading ? (
                    <div className="text-center py-6 sm:py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-sm sm:text-base text-gray-500">Loading active deliveries...</p>
                    </div>
                  ) : activeDeliveriesArray.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <Truck className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-gray-500">No active deliveries</p>
                      <p className="text-xs text-gray-400 mt-2">Accept delivery orders to see them here</p>
                    </div>
                  ) : (
                    activeDeliveriesArray.map((delivery: Delivery) => (
                      <Card key={delivery.id} className="border border-blue-200 bg-blue-50 max-w-full overflow-hidden">
                        <CardContent className="p-2 sm:p-4">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="font-semibold text-xs sm:text-lg truncate min-w-0">Order #{delivery.orderId}</div>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs flex-shrink-0">
                              In Progress
                            </Badge>
                          </div>
                          <div className="space-y-2 text-xs sm:text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs sm:text-sm">Delivery Address</p>
                                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 word-wrap break-words overflow-wrap-anywhere">{delivery.deliveryAddress}</p>
                              </div>
                            </div>
                            {/* Delivery Timer */}
                            <div className="mt-3 p-2 bg-white rounded-md border">
                              <DeliveryTimer 
                                createdAt={delivery.createdAt} 
                                estimatedTime={45} 
                              />
                            </div>
                          </div>
                          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              onClick={() => window.open(`/delivery-map/${delivery.id}`, '_blank')}
                              className="flex-1 text-xs py-2"
                              size="sm"
                            >
                              <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">Navigate</span>
                              <span className="sm:hidden">Nav</span>
                            </Button>
                            <Button
                              onClick={() => updateDeliveryStatus.mutate({ deliveryId: delivery.id, status: 'delivered' })}
                              disabled={updateDeliveryStatus.isPending}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-xs py-2"
                              size="sm"
                            >
                              <span className="hidden sm:inline">Mark Delivered</span>
                              <span className="sm:hidden">Delivered</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 sm:space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Delivery History</CardTitle>
                <CardDescription className="text-sm">Your completed deliveries</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {completedDeliveries.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <p className="text-base sm:text-lg text-gray-500">No completed deliveries yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {completedDeliveries.map((delivery: Delivery) => (
                      <Card key={delivery.id} className="border border-green-200 bg-green-50 max-w-full overflow-hidden">
                        <CardContent className="p-2 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs sm:text-lg truncate">Order #{delivery.orderId}</div>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                Delivered on {new Date(delivery.deliveredAt!).toLocaleDateString()}
                              </p>
                              {delivery.customerRating && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                                  <span className="text-xs sm:text-sm font-medium">{delivery.customerRating}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-left sm:text-right flex-shrink-0">
                              <div className="font-bold text-green-600 text-sm sm:text-lg">₹{delivery.deliveryFee}</div>
                              <Badge variant="outline" className="border-green-300 text-green-700 text-xs">
                                Completed
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Today's Earnings</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">₹{currentStats.todayEarnings.toFixed(2)}</div>
                  <p className="text-xs sm:text-sm text-gray-500">{currentStats.todayDeliveries} {currentStats.todayDeliveries === 1 ? 'delivery' : 'deliveries'}</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader className="px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">This Week</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">₹{(currentStats.todayEarnings * 7).toFixed(2)}</div>
                  <p className="text-xs sm:text-sm text-gray-500">Weekly projection</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 sm:col-span-2 lg:col-span-1">
                <CardHeader className="px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Total Lifetime</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600">₹{currentStats.totalEarnings.toFixed(2)}</div>
                  <p className="text-xs sm:text-sm text-gray-500">{currentStats.totalDeliveries} total deliveries</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="shadow-lg border-0">
              <CardHeader className="px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Profile Information</CardTitle>
                <CardDescription className="text-sm">Your delivery partner details</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-base sm:text-lg">Vehicle Details</h3>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b gap-1">
                        <span className="text-gray-600 text-sm">Vehicle Type:</span>
                        <span className="font-medium capitalize text-sm">{partner.vehicleType}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b gap-1">
                        <span className="text-gray-600 text-sm">Vehicle Number:</span>
                        <span className="font-medium text-sm">{partner.vehicleNumber}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b gap-1">
                        <span className="text-gray-600 text-sm">Driving License:</span>
                        <span className="font-medium text-sm">{partner.drivingLicense}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-base sm:text-lg">Contact & Areas</h3>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b gap-1">
                        <span className="text-gray-600 text-sm">Emergency Contact:</span>
                        <span className="font-medium text-sm">{partner.emergencyContact}</span>
                      </div>
                      <div className="py-2 border-b">
                        <span className="text-gray-600 text-sm">Delivery Areas:</span>
                        <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                          {partner.deliveryAreas.map((area: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b gap-1">
                        <span className="text-gray-600 text-sm">Status:</span>
                        <Badge 
                          variant={partner.status === 'approved' ? 'default' : 'secondary'}
                          className={`${partner.status === 'approved' ? 'bg-green-100 text-green-800' : ''} text-xs w-fit`}
                        >
                          {partner.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}