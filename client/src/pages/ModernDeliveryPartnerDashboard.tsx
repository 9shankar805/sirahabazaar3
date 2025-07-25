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
  AlertCircle,
  MessageCircle,
  Map
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
  const [currentWorkflow, setCurrentWorkflow] = useState<'idle' | 'accepted' | 'started' | 'enroute' | 'delivered'>('idle');

  // Fetch delivery partner stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/delivery-partners/${user?.id}/modern-stats`],
    enabled: !!user?.id,
    refetchInterval: 30000,
  }) as { data: DeliveryStats; isLoading: boolean };

  // Get delivery partner ID first
  const { data: partnerData } = useQuery({
    queryKey: [`/api/delivery-partners/user?userId=${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch active deliveries using partner ID
  const { data: activeDeliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: [`/api/deliveries/partner/${partnerData?.id}`],
    enabled: !!partnerData?.id,
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
      queryClient.invalidateQueries({ queryKey: [`/api/deliveries/partner/${partnerData?.id}`] });
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
              <Button
                variant="ghost"
                size="sm"
                className="relative p-1"
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 animate-pulse">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Main Content */}
        <div className="pb-32">
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
          
          <TabsContent value="notifications" className="m-0">
            <NotificationsTab notifications={notifications} />
          </TabsContent>
          
          <TabsContent value="profile" className="m-0">
            <ProfileTab />
          </TabsContent>
          
          <TabsContent value="history" className="m-0">
            <HistoryTab />
          </TabsContent>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <TabsList className="grid w-full grid-cols-6 bg-transparent h-16">
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
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Support</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
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

            <div className="space-y-2">
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
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps/dir/${delivery.pickupAddress}/${delivery.deliveryAddress}`;
                    window.open(mapsUrl, '_blank');
                  }}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
              </div>
              
              <div className="flex space-x-2">
                {delivery.status === 'pending' && (
                  <Button
                    size="sm"
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    onClick={() => onStatusUpdate(delivery.id, 'in_progress')}
                  >
                    ✓ Accept Order
                  </Button>
                )}
                {delivery.status === 'in_progress' && (
                  <Button
                    size="sm"
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    onClick={() => onStatusUpdate(delivery.id, 'picked_up')}
                  >
                    📦 Picked Up
                  </Button>
                )}
                {delivery.status === 'picked_up' && (
                  <Button
                    size="sm"
                    className="flex-1 bg-red-500 hover:bg-red-600"
                    onClick={() => onStatusUpdate(delivery.id, 'delivered')}
                  >
                    ✅ Complete
                  </Button>
                )}
              </div>
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

// Schedule Tab Component
function ScheduleTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workingHours, setWorkingHours] = useState({
    start: "09:00",
    end: "18:00",
    isAvailable: true
  });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Work Schedule</h2>
        <Badge variant={workingHours.isAvailable ? "default" : "secondary"}>
          {workingHours.isAvailable ? "Available" : "Unavailable"}
        </Badge>
      </div>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Working Hours</span>
            <span className="font-medium">{workingHours.start} - {workingHours.end}</span>
          </div>
          <Button 
            variant={workingHours.isAvailable ? "destructive" : "default"} 
            className="w-full"
            onClick={() => setWorkingHours(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
          >
            {workingHours.isAvailable ? "Mark Unavailable" : "Mark Available"}
          </Button>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div key={index} className="aspect-square">
                {day && (
                  <Button
                    variant={day === currentDate.getDate() ? "default" : "ghost"}
                    size="sm"
                    className={`w-full h-full text-sm ${
                      day === selectedDate.getDate() ? "bg-red-500 text-white" : ""
                    }`}
                    onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                  >
                    {day}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Break Time</p>
                <p className="text-sm text-gray-600">Take a 30-minute break</p>
              </div>
              <Button size="sm" variant="outline">Start Break</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Contact Tab Component
function ContactTab() {
  const contactInfo = {
    support: "+977-9805916598",
    emergency: "+977-9805916598", 
    email: "sirahabazzar@gmail.com",
    address: "Siraha Bazaar, Siraha, Nepal"
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <img 
          src="/icon2.png" 
          alt="Siraha Bazaar"
          className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23ef4444'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.3em' fill='white' font-size='24' font-weight='bold'%3ESB%3C/text%3E%3C/svg%3E";
          }}
        />
        <h2 className="font-bold text-xl">Siraha Bazaar</h2>
        <p className="text-gray-600">Delivery Support</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-2">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Support Hotline</p>
                <p className="text-sm text-gray-600">{contactInfo.support}</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => window.open(`tel:${contactInfo.support}`)}
              >
                Call
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 rounded-full p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Emergency Contact</p>
                <p className="text-sm text-gray-600">{contactInfo.emergency}</p>
              </div>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => window.open(`tel:${contactInfo.emergency}`)}
              >
                Call
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-gray-600">{contactInfo.email}</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(`mailto:${contactInfo.email}`)}
              >
                Email
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-full p-2">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Office Address</p>
                <p className="text-sm text-gray-600">{contactInfo.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 mt-8">
        <h3 className="font-semibold text-lg">Quick Help</h3>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Report Issue</p>
                <p className="text-sm text-gray-600">Technical problems or complaints</p>
              </div>
              <Button size="sm" variant="outline">Report</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Payment Help</p>
                <p className="text-sm text-gray-600">Issues with earnings or payments</p>
              </div>
              <Button size="sm" variant="outline">Get Help</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab() {
  const { user } = useAuth();
  
  const profileData = {
    name: user?.fullName || "Delivery Partner",
    phone: user?.phone || "+977-98XXXXXXXX",
    email: user?.email || "partner@sirahabazaar.com",
    rating: 4.8,
    totalDeliveries: 156,
    joinDate: "January 2024",
    vehicleType: "Motorcycle",
    licenseNumber: "BA 12 PA 3456"
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6 text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarImage src="" />
            <AvatarFallback className="bg-red-500 text-white text-2xl">
              {profileData.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <h2 className="font-bold text-xl mb-1">{profileData.name}</h2>
          <p className="text-gray-600 mb-2">Delivery Partner</p>
          <div className="flex items-center justify-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{profileData.rating}</span>
            <span className="text-gray-600">({profileData.totalDeliveries} deliveries)</span>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Phone</span>
            <span className="font-medium">{profileData.phone}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Email</span>
            <span className="font-medium">{profileData.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Joined</span>
            <span className="font-medium">{profileData.joinDate}</span>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Vehicle Type</span>
            <span className="font-medium">{profileData.vehicleType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">License Number</span>
            <span className="font-medium">{profileData.licenseNumber}</span>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Deliveries</span>
            <Badge variant="secondary">{profileData.totalDeliveries}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Success Rate</span>
            <Badge className="bg-green-100 text-green-800">98.5%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Average Rating</span>
            <Badge className="bg-yellow-100 text-yellow-800">{profileData.rating}/5.0</Badge>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full">Edit Profile</Button>
    </div>
  );
}

// History Tab Component
function HistoryTab() {
  const [filter, setFilter] = useState("all");
  
  const deliveryHistory = [
    {
      id: 1,
      orderId: "SB000123",
      date: "2025-07-25",
      time: "14:30",
      customer: "Ram Bahadur",
      amount: "₹45",
      status: "completed",
      rating: 5
    },
    {
      id: 2,
      orderId: "SB000122",
      date: "2025-07-25",
      time: "12:15",
      customer: "Sita Devi",
      amount: "₹30",
      status: "completed",
      rating: 4
    },
    {
      id: 3,
      orderId: "SB000121",
      date: "2025-07-24",
      time: "16:45",
      customer: "Hari Sharma",
      amount: "₹55",
      status: "completed",
      rating: 5
    },
    {
      id: 4,
      orderId: "SB000120",
      date: "2025-07-24",
      time: "11:20",
      customer: "Maya Gurung",
      amount: "₹40",
      status: "cancelled",
      rating: null
    }
  ];

  const filteredHistory = deliveryHistory.filter(delivery => 
    filter === "all" || delivery.status === filter
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Delivery History</h2>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card>
          <CardContent className="p-3 text-center">
            <h3 className="font-bold text-lg text-green-600">
              {deliveryHistory.filter(d => d.status === 'completed').length}
            </h3>
            <p className="text-xs text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <h3 className="font-bold text-lg text-red-600">
              {deliveryHistory.filter(d => d.status === 'cancelled').length}
            </h3>
            <p className="text-xs text-gray-600">Cancelled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <h3 className="font-bold text-lg text-blue-600">
              ₹{deliveryHistory.filter(d => d.status === 'completed')
                .reduce((sum, d) => sum + parseInt(d.amount.replace('₹', '')), 0)}
            </h3>
            <p className="text-xs text-gray-600">Total Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.map(delivery => (
          <Card key={delivery.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">Order {delivery.orderId}</h3>
                  <p className="text-sm text-gray-600">{delivery.customer}</p>
                </div>
                <Badge 
                  variant={delivery.status === 'completed' ? 'default' : 'destructive'}
                  className={delivery.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                >
                  {delivery.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{delivery.date} at {delivery.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {delivery.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{delivery.rating}</span>
                    </div>
                  )}
                  <span className="font-bold">{delivery.amount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
            <Clock className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="font-bold text-lg mb-2">No History Found</h3>
          <p className="text-gray-600">No deliveries match your filter criteria.</p>
        </div>
      )}
    </div>
  );
}

// Notifications Tab Component  
function NotificationsTab({ notifications }: { notifications: any[] }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Delivery Alerts</h2>
        <Badge variant="secondary">{notifications.filter(n => !n.isRead).length} unread</Badge>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
              <Bell className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="font-bold text-lg mb-2">No Notifications</h3>
            <p className="text-gray-600">You're all caught up! New alerts will appear here.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className={`border-l-4 ${
              notification.type === 'delivery' ? 'border-l-blue-500' : 
              notification.type === 'earnings' ? 'border-l-green-500' : 
              'border-l-orange-500'
            } ${!notification.isRead ? 'bg-blue-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-full p-2 ${
                      notification.type === 'delivery' ? 'bg-blue-100' : 
                      notification.type === 'earnings' ? 'bg-green-100' : 
                      'bg-orange-100'
                    }`}>
                      {notification.type === 'delivery' ? (
                        <Package className="h-4 w-4 text-blue-600" />
                      ) : notification.type === 'earnings' ? (
                        <DollarSign className="h-4 w-4 text-green-600" />
                      ) : (
                        <Route className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{notification.title}</h3>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
                
                {notification.type === 'delivery' && notification.orderId && (
                  <div className="flex space-x-2 mt-3">
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => {
                        window.location.hash = 'orders';
                      }}
                    >
                      ✓ Accept Order
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const mapsUrl = `https://www.google.com/maps/search/Siraha+Electronics+Hub+Siraha+Nepal`;
                        window.open(mapsUrl, '_blank');
                      }}
                    >
                      📍 Navigate
                    </Button>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}