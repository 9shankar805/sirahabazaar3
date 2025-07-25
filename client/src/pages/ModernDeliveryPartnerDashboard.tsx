import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
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
  Map,
  ChevronLeft,
  Settings,
  Globe,
  Target,
  Timer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom delivery partner icon
const deliveryPartnerIcon = new L.DivIcon({
  html: `
    <div style="
      width: 32px; 
      height: 32px; 
      background: linear-gradient(135deg, #f59e0b, #dc2626); 
      border: 3px solid white; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
      animation: pulse 2s infinite;
    ">
      <div style="
        width: 16px; 
        height: 16px; 
        background: white; 
        border-radius: 50%;
      "></div>
    </div>
  `,
  className: 'custom-delivery-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Custom store icon
const storeIcon = new L.DivIcon({
  html: `
    <div style="
      width: 28px; 
      height: 28px; 
      background: #3b82f6; 
      border: 2px solid white; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
    ">
      <div style="
        width: 12px; 
        height: 12px; 
        background: white; 
        border-radius: 50%;
      "></div>
    </div>
  `,
  className: 'custom-store-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

// Custom customer icon
const customerIcon = new L.DivIcon({
  html: `
    <div style="
      width: 24px; 
      height: 24px; 
      background: #10b981; 
      border: 2px solid white; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
    ">
      <div style="
        width: 8px; 
        height: 8px; 
        background: white; 
        border-radius: 50%;
      "></div>
    </div>
  `,
  className: 'custom-customer-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

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
  const [showSplash, setShowSplash] = useState(true);
  const [language, setLanguage] = useState("English");
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
    queryKey: [`/api/deliveries/partner/${(partnerData as any)?.id}`],
    enabled: !!(partnerData as any)?.id,
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
      queryClient.invalidateQueries({ queryKey: [`/api/deliveries/partner/${(partnerData as any)?.id}`] });
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

  // Auto-hide splash screen after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return <SplashScreen language={language} setLanguage={setLanguage} onSkip={() => setShowSplash(false)} />;
  }

  if (showSplash) {
    return <SplashScreen language={language} setLanguage={setLanguage} onSkip={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <MapPin className="h-6 w-6" />
              <div>
                <h1 className="font-bold text-lg">Siraha Bazaar</h1>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <span className="text-sm opacity-90">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={isOnline ? "secondary" : "default"}
                size="sm"
                onClick={toggleOnlineStatus}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
              </Button>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 hover:bg-white/20"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-yellow-400 text-black animate-pulse">
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pb-20">
          <TabsContent value="dashboard" className="m-0">
            <ModernDashboardTab stats={stats} statsLoading={statsLoading} />
          </TabsContent>
          
          <TabsContent value="orders" className="m-0">
            <ModernOrdersTab 
              activeDeliveries={activeDeliveries} 
              deliveriesLoading={deliveriesLoading}
              onStatusUpdate={handleStatusUpdate}
            />
          </TabsContent>
          
          <TabsContent value="map" className="m-0">
            <ModernMapTab activeDeliveries={activeDeliveries} />
          </TabsContent>
          
          <TabsContent value="schedule" className="m-0">
            <ModernScheduleTab />
          </TabsContent>
          
          <TabsContent value="profile" className="m-0">
            <ModernProfileTab />
          </TabsContent>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <TabsList className="grid w-full grid-cols-5 bg-transparent h-16">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Package className="h-5 w-5" />
              <span className="text-xs">Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <MapPin className="h-5 w-5" />
              <span className="text-xs">Map</span>
            </TabsTrigger>
            <TabsTrigger 
              value="schedule" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Schedule</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="flex flex-col space-y-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-600"
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}

// Splash Screen Component
function SplashScreen({ 
  language, 
  setLanguage, 
  onSkip 
}: { 
  language: string; 
  setLanguage: (lang: string) => void; 
  onSkip: () => void; 
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      {/* Logo Section */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Logo</h1>
        <p className="text-gray-600">Delivery Partner App</p>
      </div>

      {/* Language Selection */}
      <div className="w-full max-w-xs space-y-4">
        <div 
          onClick={() => setLanguage("English")}
          className={`w-full p-4 rounded-xl border-2 cursor-pointer transition-all ${
            language === "English" 
              ? "border-red-500 bg-red-50" 
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">English</span>
          </div>
        </div>

        <div 
          onClick={() => setLanguage("Français")}
          className={`w-full p-4 rounded-xl border-2 cursor-pointer transition-all ${
            language === "Français" 
              ? "border-red-500 bg-red-50" 
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">Français</span>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <Button 
        onClick={onSkip}
        className="w-full max-w-xs mt-8 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl"
      >
        Continue
      </Button>

      {/* Footer */}
      <p className="text-gray-400 text-sm mt-8">Powered by Siraha</p>
    </div>
  );
}

// Modern Dashboard Tab Component
function ModernDashboardTab({ stats, statsLoading }: { stats: DeliveryStats; statsLoading: boolean }) {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

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
    <div className="bg-gradient-to-b from-red-500 to-orange-500 min-h-screen text-white">
      {/* Date Header */}
      <div className="text-center py-8">
        <div className="text-6xl font-bold mb-2">{currentDay}</div>
        <div className="text-xl opacity-90">{dayName}</div>
        <div className="text-sm opacity-75">{currentMonth} {currentYear}</div>
      </div>

      {/* Schedule Section */}
      <div className="px-4 pb-4">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Today's Schedule</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">9:30 AM - 10:00 AM</span>
                </div>
                <span className="text-sm font-medium">Work Started Today</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm">10:30 AM - 12:00 PM</span>
                </div>
                <span className="text-sm font-medium">Active Delivery Time</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm">2:00 PM - 6:00 PM</span>
                </div>
                <span className="text-sm font-medium">Peak Hours Available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="px-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1">₹{stats?.todayEarnings || 0}</div>
              <div className="text-sm opacity-75">Today Earnings</div>
              <div className="text-xs opacity-60">{stats?.todayDeliveries || 0} deliveries</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1">{stats?.rating || 0}</div>
              <div className="text-sm opacity-75">Average Rating</div>
              <div className="text-xs opacity-60">{stats?.totalDeliveries || 0} total deliveries</div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold">₹{stats?.weeklyEarnings || 0}</div>
                <div className="text-sm opacity-75">This Week's Earnings</div>
              </div>
              <TrendingUp className="h-8 w-8 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Modern Orders Tab Component
function ModernOrdersTab({ 
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
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-red-500 to-orange-500 min-h-screen">
      {/* Header */}
      <div className="text-white text-center py-6">
        <h2 className="text-xl font-bold">Real-Time Delivery Status</h2>
        <p className="text-sm opacity-75">Track your active deliveries</p>
      </div>

      {/* Delivery Route Map Placeholder */}
      <div className="mx-4 mb-4">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="h-40 bg-green-100 rounded-lg relative overflow-hidden">
              {/* Map simulation */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-300">
                {/* Road lines */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 transform -translate-y-1/2"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-300 transform -translate-x-1/2"></div>
                
                {/* Delivery markers */}
                <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div className="absolute bottom-1/4 right-1/4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-white text-xs font-bold">B</span>
                </div>
                
                {/* Delivery path */}
                <svg className="absolute inset-0 w-full h-full">
                  <path
                    d="M 25% 25% Q 50% 50% 75% 75%"
                    stroke="#ef4444"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="5,5"
                    className="animate-pulse"
                  />
                </svg>
              </div>
              
              {/* Distance indicator */}
              <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-800">
                1.3 km
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliveries */}
      <div className="px-4 space-y-3">
        {activeDeliveries.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center text-white">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-60" />
              <h3 className="font-bold mb-2">No Active Deliveries</h3>
              <p className="text-sm opacity-75">You're ready for new orders!</p>
              <Button className="mt-4 bg-green-500 hover:bg-green-600">
                START DELIVERY
              </Button>
            </CardContent>
          </Card>
        ) : (
          activeDeliveries.map((delivery) => (
            <Card key={delivery.id} className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Order #{delivery.orderId}</h3>
                    <p className="text-sm text-gray-600">{delivery.customerName}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-1">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <p className="text-xs text-gray-600">13 min</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Pickup</p>
                      <p className="text-xs text-gray-600">{delivery.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="ml-1.5 w-0.5 h-4 bg-gray-300"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Delivery</p>
                      <p className="text-xs text-gray-600">{delivery.deliveryAddress}</p>
                    </div>
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
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    onClick={() => onStatusUpdate(delivery.id, 'delivered')}
                  >
                    START DELIVERY
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Modern Map Tab Component
function ModernMapTab({ activeDeliveries }: { activeDeliveries: ActiveDelivery[] }) {
  return (
    <div className="relative h-screen bg-gradient-to-b from-red-500 to-orange-500">
      {/* Map Container */}
      <div className="absolute inset-0">
        <div className="h-full bg-green-100 relative overflow-hidden">
          {/* Map simulation with roads */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-300">
            {/* Major roads */}
            <div className="absolute top-1/3 left-0 right-0 h-2 bg-gray-400"></div>
            <div className="absolute top-2/3 left-0 right-0 h-2 bg-gray-400"></div>
            <div className="absolute top-0 bottom-0 left-1/3 w-2 bg-gray-400"></div>
            <div className="absolute top-0 bottom-0 right-1/3 w-2 bg-gray-400"></div>
            
            {/* Delivery locations */}
            <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg animate-pulse">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            
            <div className="absolute top-3/4 right-1/4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
              <Target className="h-4 w-4 text-white" />
            </div>
          </div>
          
          {/* Time indicator */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-800">13 min</span>
            </div>
          </div>
          
          {/* Bottom action panel */}
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">Active Route</h3>
                    <p className="text-sm text-gray-600">Siraha Electronics Hub</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">1.3 km</div>
                    <div className="text-sm text-gray-600">Distance</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button className="bg-green-500 hover:bg-green-600" size="sm">
                    START DELIVERY
                  </Button>
                  <Button variant="outline" size="sm">
                    DIRECTIONS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modern Schedule Tab Component  
function ModernScheduleTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Calendar data
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
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
    <div className="bg-gradient-to-b from-red-500 to-orange-500 min-h-screen text-white">
      {/* Header */}
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold">{monthNames[currentMonth]}</h2>
        <p className="text-sm opacity-75">{currentYear}</p>
      </div>

      {/* Calendar */}
      <div className="px-4">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center text-sm font-medium py-2 text-white/70">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div key={index} className="aspect-square">
                  {day && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full h-full text-sm hover:bg-white/20 ${
                        day === currentDate.getDate() 
                          ? "bg-white text-red-500 font-bold hover:bg-white/90" 
                          : "text-white"
                      } ${
                        day === selectedDate.getDate() && day !== currentDate.getDate()
                          ? "bg-white/30 border border-white/50" 
                          : ""
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
      </div>

      {/* Schedule items */}
      <div className="px-4 mt-4 space-y-3">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div>
                  <p className="font-medium">Morning Shift</p>
                  <p className="text-sm opacity-75">9:00 AM - 1:00 PM</p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div>
                  <p className="font-medium">Afternoon Shift</p>
                  <p className="text-sm opacity-75">2:00 PM - 6:00 PM</p>
                </div>
              </div>
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Modern Profile Tab Component
function ModernProfileTab() {
  const { user } = useAuth();
  
  return (
    <div className="bg-gradient-to-b from-red-500 to-orange-500 min-h-screen text-white">
      {/* Profile Header */}
      <div className="text-center py-8">
        <Avatar className="w-20 h-20 mx-auto mb-4 border-3 border-white/30">
          <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
            {user?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'DP'}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold mb-1">{user?.fullName || 'Delivery Partner'}</h2>
        <p className="text-sm opacity-75">Professional Delivery Partner</p>
        <div className="flex items-center justify-center space-x-1 mt-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">4.8</span>
          <span className="opacity-75">(156 reviews)</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1">156</div>
              <div className="text-sm opacity-75">Total Deliveries</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1">98.5%</div>
              <div className="text-sm opacity-75">Success Rate</div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Vehicle Information</h3>
              <Settings className="h-5 w-5 opacity-60" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-75">Vehicle Type</span>
                <span>Motorcycle</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-75">License</span>
                <span>BA 12 PA 3456</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-75">Status</span>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start hover:bg-white/20">
                <Phone className="h-4 w-4 mr-3" />
                Contact Support
              </Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-white/20">
                <Settings className="h-4 w-4 mr-3" />
                Account Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-white/20">
                <AlertCircle className="h-4 w-4 mr-3" />
                Report Issue
              </Button>
            </div>
          </CardContent>
        </Card>
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
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Center coordinates for the map (Siraha, Nepal)
  const defaultCenter: [number, number] = [26.6586, 86.2003];

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use default location if GPS fails
          setUserLocation({ lat: 26.6586, lng: 86.2003 });
        }
      );
    } else {
      // Use default location if geolocation not supported
      setUserLocation({ lat: 26.6586, lng: 86.2003 });
    }
  }, []);

  return (
    <div className="relative h-screen">
      {userLocation ? (
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          scrollWheelZoom={true}
          doubleClickZoom={true}
          touchZoom={true}
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Delivery Partner Location */}
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={deliveryPartnerIcon}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold">Your Location</h3>
                <p className="text-sm text-gray-600">Delivery Partner</p>
              </div>
            </Popup>
          </Marker>

          {/* Active Delivery Markers */}
          {activeDeliveries.map((delivery) => (
            <div key={delivery.id}>
              {/* Store/Pickup Location */}
              {delivery.pickupLat && delivery.pickupLng && (
                <Marker
                  position={[parseFloat(delivery.pickupLat), parseFloat(delivery.pickupLng)]}
                  icon={storeIcon}
                >
                  <Popup>
                    <div className="text-center max-w-xs">
                      <h3 className="font-semibold">Pickup Location</h3>
                      <p className="text-sm text-gray-600 mb-1">Order #{delivery.orderId}</p>
                      <p className="text-xs text-gray-500">{delivery.pickupAddress}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        Store
                      </Badge>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Customer/Delivery Location */}
              {delivery.deliveryLat && delivery.deliveryLng && (
                <Marker
                  position={[parseFloat(delivery.deliveryLat), parseFloat(delivery.deliveryLng)]}
                  icon={customerIcon}
                >
                  <Popup>
                    <div className="text-center max-w-xs">
                      <h3 className="font-semibold">Delivery Location</h3>
                      <p className="text-sm text-gray-600 mb-1">{delivery.customerName}</p>
                      <p className="text-xs text-gray-500">{delivery.deliveryAddress}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        Customer
                      </Badge>
                    </div>
                  </Popup>
                </Marker>
              )}
            </div>
          ))}
        </MapContainer>
      ) : (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="bg-white rounded-full p-6 w-fit mx-auto mb-4 shadow-lg">
              <MapPin className="h-12 w-12 text-red-500 animate-pulse" />
            </div>
            <h3 className="font-bold text-lg mb-2">Loading Map...</h3>
            <p className="text-gray-600 mb-4">Getting your location</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[999] flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomIn();
              }
            }}
            className="w-10 h-10 p-0 rounded-none border-b border-gray-200 hover:bg-red-50"
            title="Zoom In"
          >
            <span className="text-lg font-bold text-red-600">+</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomOut();
              }
            }}
            className="w-10 h-10 p-0 rounded-none hover:bg-red-50"
            title="Zoom Out"
          >
            <span className="text-lg font-bold text-red-600">−</span>
          </Button>
        </div>

        {/* Center on User Location */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (userLocation && mapRef.current) {
              mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
            }
          }}
          className="bg-white shadow-lg hover:bg-red-50"
          title="Center on My Location"
        >
          <Target className="h-4 w-4 text-red-600" />
        </Button>
      </div>

      {/* Active Deliveries Counter */}
      {activeDeliveries.length > 0 && (
        <div className="absolute top-4 left-4 z-[999]">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="bg-red-500 rounded-full p-2">
                  <Route className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">{activeDeliveries.length} Active Deliveries</p>
                  <p className="text-xs text-gray-600">Tap markers for details</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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