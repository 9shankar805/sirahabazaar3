import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Clock, 
  TrendingUp, 
  Navigation, 
  Phone, 
  Info,
  Calendar,
  DollarSign,
  Package,
  Star,
  Bell,
  Menu,
  Home,
  Route,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryStats {
  todayEarnings: number;
  todayDeliveries: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalDeliveries: number;
  rating: number;
  activeOrders: number;
}

interface ActiveDelivery {
  id: number;
  orderId: number;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  totalAmount: string;
  deliveryFee: string;
  status: string;
  estimatedTime: string;
  distance: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

export default function ModernDeliveryPartnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isOnline, setIsOnline] = useState(true);

  // Fetch delivery partner stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/delivery-partners/${user?.id}/modern-stats`],
    enabled: !!user?.id,
    refetchInterval: 30000,
  }) as { data: DeliveryStats; isLoading: boolean };

  // Fetch active deliveries
  const { data: activeDeliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: [`/api/deliveries/active/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 10000,
  }) as { data: ActiveDelivery[]; isLoading: boolean };

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: [`/api/notifications/user/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 5000,
  }) as { data: Notification[] };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  // Update delivery status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ deliveryId, status }: { deliveryId: number; status: string }) => {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deliveries/active/${user?.id}`] });
      toast({ title: "Status updated successfully!" });
    },
  });

  const handleStatusUpdate = (deliveryId: number, status: string) => {
    updateStatusMutation.mutate({ deliveryId, status });
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast({
      title: isOnline ? "You're now offline" : "You're now online",
      description: isOnline ? "You won't receive new orders" : "Ready to receive orders",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Please Login</h2>
            <p className="text-gray-600">Access your delivery dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/icon2.png" 
              alt="Siraha Bazaar"
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLDivElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-10 h-10 bg-red-500 rounded-full items-center justify-center hidden">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Siraha Bazaar</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={isOnline ? "destructive" : "default"}
              size="sm"
              onClick={toggleOnlineStatus}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500">
                  {unreadNotifications}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-32">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="dashboard" className="m-0">
            <DashboardTab stats={stats} statsLoading={statsLoading} />
          </TabsContent>
          
          <TabsContent value="orders" className="m-0">
            <OrdersTab 
              activeDeliveries={activeDeliveries} 
              deliveriesLoading={deliveriesLoading}
              onStatusUpdate={handleStatusUpdate}
            />
          </TabsContent>
          
          <TabsContent value="map" className="m-0">
            <MapTab activeDeliveries={activeDeliveries} />
          </TabsContent>
          
          <TabsContent value="earnings" className="m-0">
            <EarningsTab stats={stats} />
          </TabsContent>
          
          <TabsContent value="schedule" className="m-0">
            <ScheduleTab />
          </TabsContent>
          
          <TabsContent value="contact" className="m-0">
            <ContactTab />
          </TabsContent>
          
          <TabsContent value="profile" className="m-0">
            <ProfileTab />
          </TabsContent>
          
          <TabsContent value="history" className="m-0">
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-0">
          <TabsList className="grid w-full grid-cols-4 bg-transparent h-16">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Home className="h-4 w-4" />
              <span className="text-xs">Home</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Package className="h-4 w-4" />
              <span className="text-xs">Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <MapPin className="h-4 w-4" />
              <span className="text-xs">Map</span>
            </TabsTrigger>
            <TabsTrigger 
              value="earnings" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Earnings</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="grid grid-cols-4 gap-0 border-t bg-gray-50">
          <TabsList className="grid w-full grid-cols-4 bg-transparent h-16">
            <TabsTrigger 
              value="schedule" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Schedule</span>
            </TabsTrigger>
            <TabsTrigger 
              value="contact" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Info className="h-4 w-4" />
              <span className="text-xs">Contact</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Star className="h-4 w-4" />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Clock className="h-4 w-4" />
              <span className="text-xs">History</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({ stats, statsLoading }: { stats: DeliveryStats; statsLoading: boolean }) {
  if (statsLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Today's Summary */}
      <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Today's Earnings</p>
              <h2 className="text-3xl font-bold">₹{stats?.todayEarnings || 0}</h2>
              <p className="text-red-100 text-sm">{stats?.todayDeliveries || 0} deliveries</p>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-xl">{stats?.totalDeliveries || 0}</h3>
            <p className="text-gray-600 text-sm">Total Deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="bg-yellow-100 rounded-full p-3 w-fit mx-auto mb-2">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="font-bold text-xl">{stats?.rating || 0}</h3>
            <p className="text-gray-600 text-sm">Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly & Monthly */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Weekly Earnings</p>
                <h3 className="font-bold text-xl">₹{stats?.weeklyEarnings || 0}</h3>
              </div>
              <div className="bg-blue-100 rounded-full p-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Earnings</p>
                <h3 className="font-bold text-xl">₹{stats?.monthlyEarnings || 0}</h3>
              </div>
              <div className="bg-purple-100 rounded-full p-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Orders Tab Component
function OrdersTab({ 
  activeDeliveries, 
  deliveriesLoading, 
  onStatusUpdate 
}: { 
  activeDeliveries: ActiveDelivery[]; 
  deliveriesLoading: boolean;
  onStatusUpdate: (deliveryId: number, status: string) => void;
}) {
  if (deliveriesLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (activeDeliveries.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
          <Package className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="font-bold text-lg mb-2">No Active Orders</h3>
        <p className="text-gray-600">You're all caught up! New orders will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Active Orders</h2>
        <Badge variant="secondary">{activeDeliveries.length} active</Badge>
      </div>

      {activeDeliveries.map((delivery) => (
        <Card key={delivery.id} className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">Order #{delivery.orderId}</h3>
                <p className="text-sm text-gray-600">{delivery.customerName}</p>
              </div>
              <Badge 
                variant={delivery.status === 'in_progress' ? 'default' : 'secondary'}
                className="bg-red-100 text-red-800"
              >
                {delivery.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Pickup</p>
                  <p className="text-gray-600">{delivery.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Navigation className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Delivery</p>
                  <p className="text-gray-600">{delivery.deliveryAddress}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{delivery.estimatedTime}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Route className="h-4 w-4" />
                  <span>{delivery.distance}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">₹{delivery.deliveryFee}</p>
                <p className="text-sm text-gray-600">Delivery fee</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`tel:${delivery.customerPhone}`)}
              >
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => onStatusUpdate(delivery.id, 'delivered')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Map Tab Component
function MapTab({ activeDeliveries }: { activeDeliveries: ActiveDelivery[] }) {
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="bg-white rounded-full p-6 w-fit mx-auto mb-4 shadow-lg">
            <MapPin className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="font-bold text-lg mb-2">Map View</h3>
          <p className="text-gray-600 mb-4">Interactive delivery route map</p>
          {activeDeliveries.length > 0 && (
            <Badge className="bg-red-500">{activeDeliveries.length} active routes</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Earnings Tab Component
function EarningsTab({ stats }: { stats: DeliveryStats }) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold text-lg">Earnings Overview</h2>
      
      <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-green-100 text-sm">Total Earnings</p>
            <h2 className="text-4xl font-bold mb-2">₹{(stats?.monthlyEarnings || 0) * 3}</h2>
            <p className="text-green-100">All time earnings</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today</p>
                <h3 className="font-bold text-xl">₹{stats?.todayEarnings || 0}</h3>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>{stats?.todayDeliveries || 0} deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">This Week</p>
                <h3 className="font-bold text-xl">₹{stats?.weeklyEarnings || 0}</h3>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>{Math.floor((stats?.totalDeliveries || 0) / 4)} avg/week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">This Month</p>
                <h3 className="font-bold text-xl">₹{stats?.monthlyEarnings || 0}</h3>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>{stats?.totalDeliveries || 0} total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}