import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Package, 
  MapPin, 
  Heart, 
  Settings, 
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Bell,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiPut } from "@/lib/api";
import NotificationCenter from "@/components/NotificationCenter";
import ReturnPolicy from "@/components/ReturnPolicy";
import type { Order, OrderItem } from "@shared/schema";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type ProfileForm = z.infer<typeof profileSchema>;

const addressSchema = z.object({
  title: z.string().min(1, "Address title is required"),
  address: z.string().min(10, "Full address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("orders");
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Queries
  const { data: orders = [] } = useQuery<(Order & { items: OrderItem[] })[]>({
    queryKey: [`/api/orders/customer/${user?.id}`],
    enabled: !!user,
  });

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Address form
  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: "",
      address: "",
      city: "Siraha",
      postalCode: "",
    },
  });

  const handleProfileUpdate = async (data: ProfileForm) => {
    if (!user) return;

    try {
      await apiPut(`/api/users/${user.id}`, data);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "processing":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (!user || user.role !== "customer") {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">This page is only accessible to customers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Account</h1>
            <p className="text-muted-foreground">Welcome back, {user.fullName}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{user.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      activeTab === "orders" 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Order History</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("addresses")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      activeTab === "addresses" 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Addresses</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("wishlist")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      activeTab === "wishlist" 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <Heart className="h-4 w-4" />
                    <span>Wishlist</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      activeTab === "notifications" 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("returns")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      activeTab === "returns" 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Returns</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
                      activeTab === "profile" 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Order History */}
            {activeTab === "orders" && (
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't placed any orders yet. Start shopping to see your orders here.
                      </p>
                      <Button>Start Shopping</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                              <p className="text-sm text-muted-foreground">
                                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2 mb-2">
                                {getStatusIcon(order.status)}
                                <Badge variant={getStatusBadgeVariant(order.status)}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="font-semibold text-lg">
                                ₹{Number(order.totalAmount).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium mb-2">Delivery Address</h4>
                              <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Payment Method</h4>
                              <p className="text-sm text-muted-foreground">
                                {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod.toUpperCase()}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-6">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            {order.status === "delivered" && (
                              <Button variant="outline" size="sm">
                                Reorder
                              </Button>
                            )}
                            {order.status !== "delivered" && order.status !== "cancelled" && (
                              <Button variant="outline" size="sm">
                                Track Order
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Addresses */}
            {activeTab === "addresses" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Saved Addresses</span>
                    <Button size="sm">Add New Address</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Sample addresses */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">Home</h3>
                            <Badge variant="secondary">Default</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            Mahendra Chowk, Siraha-56600<br />
                            Nepal<br />
                            Phone: {user.phone || "+977-9841234567"}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Delete</Button>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium mb-2">Office</h3>
                          <p className="text-sm text-muted-foreground">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            District Office, Siraha-56600<br />
                            Nepal<br />
                            Phone: {user.phone || "+977-9841234567"}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Delete</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wishlist */}
            {activeTab === "wishlist" && (
              <Card>
                <CardHeader>
                  <CardTitle>My Wishlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
                    <p className="text-muted-foreground mb-4">
                      Save items you love to your wishlist and shop them later.
                    </p>
                    <Button>Start Shopping</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Settings */}
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Account Type:</p>
                            <p className="font-medium capitalize">{user.role}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Member Since:</p>
                            <p className="font-medium">
                              {new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="btn-primary">
                        Update Profile
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NotificationCenter userId={user.id} />
                </CardContent>
              </Card>
            )}

            {/* Returns */}
            {activeTab === "returns" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <RefreshCw className="h-5 w-5" />
                    <span>Returns & Refunds</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReturnPolicy customerId={user.id} orderItems={orders.flatMap(order => order.items)} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
