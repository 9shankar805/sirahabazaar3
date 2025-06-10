import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Store, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown,
  Users, Star, Eye, BarChart3, PieChart, Activity, Settings,
  Plus, Edit, Trash2, Search, Filter, Download, Calendar, UtensilsCrossed,
  ChefHat, Clock, Coffee, Utensils, MapPin, Phone, Mail, Globe,
  CheckCircle, XCircle, AlertCircle, Timer, Receipt, Truck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  originalPrice: z.string().optional(),
  categoryId: z.number().min(1, "Category is required"),
  stock: z.number().min(0, "Stock must be 0 or greater"),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).min(1, "At least 1 image is required").max(6, "Maximum 6 images allowed"),
  isFastSell: z.boolean().default(false),
  isOnOffer: z.boolean().default(false),
  offerPercentage: z.number().min(0).max(100).default(0),
  offerEndDate: z.string().optional(),
  // Food-specific fields
  preparationTime: z.string().optional(),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  spiceLevel: z.string().optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  nutritionInfo: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface RestaurantStats {
  totalMenuItems: number;
  totalProducts: number;
  todayOrders: number;
  totalOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  averageRating: number;
  totalReviews: number;
  averagePreparationTime: number;
  tablesOccupied: number;
  totalTables: number;
  staffOnDuty: number;
}

interface StoreAnalytics {
  id: number;
  storeId: number;
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  productViews: number;
  addToCartCount: number;
  checkoutCount: number;
  ordersCount: number;
  revenue: string;
  conversionRate: string;
}

interface User {
  id: number;
  role: string;
  fullName: string;
  email: string;
}

interface Store {
  id: number;
  name: string;
  ownerId: number;
  storeType?: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export default function SellerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userStore, setUserStore] = useState<Store | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { user } = useAuth();

  // Check if this is a restaurant or retail store
  const isRestaurant = userStore?.storeType === 'restaurant';
  const dashboardTitle = isRestaurant ? 'Restaurant Dashboard' : 'Store Dashboard';
  const dashboardIcon = isRestaurant ? ChefHat : Store;

  // Form for adding/editing products
  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      categoryId: 1,
      stock: 0,
      imageUrl: "",
      images: [],
      isFastSell: false,
      isOnOffer: false,
      offerPercentage: 0,
      offerEndDate: "",
      preparationTime: "",
      ingredients: [],
      allergens: [],
      spiceLevel: "",
      isVegetarian: false,
      isVegan: false,
      nutritionInfo: "",
    },
  });

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  // Store query to get current store info
  const { data: stores = [] } = useQuery({
    queryKey: [`/api/stores/owner`, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await fetch(`/api/stores/owner/${currentUser.id}`);
      if (!response.ok) throw new Error('Failed to fetch stores');
      return response.json();
    },
    enabled: !!currentUser,
  });

  const currentStore = stores[0]; // Assuming one store per shopkeeper

  useEffect(() => {
    if (currentStore) {
      setUserStore(currentStore);
    }
  }, [currentStore]);

  // Dashboard stats query with optimized caching
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats, error: statsError } = useQuery<RestaurantStats>({
    queryKey: ['/api/seller/dashboard', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) throw new Error('User ID required');
      const response = await fetch(`/api/seller/dashboard?userId=${currentUser.id}`);
      if (!response.ok) throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      return response.json();
    },
    enabled: !!currentUser?.id,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Analytics query with improved error handling
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery<StoreAnalytics[]>({
    queryKey: ['/api/seller/analytics', currentUser?.id, selectedPeriod],
    queryFn: async () => {
      if (!currentUser?.id) throw new Error('User ID required');
      const response = await fetch(`/api/seller/analytics?userId=${currentUser.id}&days=${selectedPeriod}`);
      if (!response.ok) throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      return response.json();
    },
    enabled: !!currentUser?.id,
    staleTime: 300000, // 5 minutes for analytics
    refetchOnWindowFocus: false
  });

  // Products query with fast loading
  const { data: products = [], isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ['/api/products/store', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await fetch(`/api/products/store?userId=${currentUser.id}`);
      if (!response.ok) throw new Error(`Failed to fetch products: ${response.statusText}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!currentUser?.id,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Orders query with efficient updates
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders, error: ordersError } = useQuery({
    queryKey: ['/api/orders/store', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await fetch(`/api/orders/store?userId=${currentUser.id}`);
      if (!response.ok) throw new Error(`Failed to fetch orders: ${response.statusText}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!currentUser?.id,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for orders
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Categories query
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Product management functions
  const handleAddProduct = async (data: ProductForm) => {
    if (!currentStore) return;

    try {
      const productData = {
        ...data,
        storeId: currentStore.id,
        price: data.price,
        originalPrice: data.originalPrice || undefined,
        images: data.images || [],
        imageUrl: data.images?.[0] || undefined,
        isFastSell: data.isFastSell || false,
        isOnOffer: data.isOnOffer || false,
        offerPercentage: data.offerPercentage || 0,
        offerEndDate: data.offerEndDate || undefined,
        productType: currentStore.storeType === 'restaurant' ? 'food' : 'retail',
        // Food-specific fields for restaurants
        preparationTime: currentStore.storeType === 'restaurant' ? data.preparationTime || null : null,
        ingredients: currentStore.storeType === 'restaurant' ? data.ingredients || [] : [],
        allergens: currentStore.storeType === 'restaurant' ? data.allergens || [] : [],
        spiceLevel: currentStore.storeType === 'restaurant' ? data.spiceLevel || null : null,
        isVegetarian: currentStore.storeType === 'restaurant' ? data.isVegetarian || false : false,
        isVegan: currentStore.storeType === 'restaurant' ? data.isVegan || false : false,
        nutritionInfo: currentStore.storeType === 'restaurant' ? data.nutritionInfo || null : null,
      };

      if (editingProduct) {
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Failed to update product');
        toast({ title: "Product updated successfully" });
      } else {
        const response = await fetch("/api/products", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Failed to create product');
        toast({ title: "Product added successfully" });
      }

      productForm.reset();
      setEditingProduct(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/products/store/${currentStore.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      originalPrice: product.originalPrice || "",
      categoryId: product.categoryId || 0,
      stock: product.stock || 0,
      imageUrl: product.images?.[0] || "",
      images: product.images || [],
      isFastSell: product.isFastSell || false,
      isOnOffer: product.isOnOffer || false,
      offerPercentage: product.offerPercentage || 0,
      offerEndDate: product.offerEndDate || "",
    });
    setActiveTab("add-product");
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete product');
      toast({ title: "Product deleted successfully" });
      // Invalidate queries to refresh data
      if (currentStore) {
        queryClient.invalidateQueries({ queryKey: [`/api/products/store/${currentStore.id}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  if (!currentUser || currentUser.role !== 'shopkeeper') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You need to be a shopkeeper to access the seller dashboard.
            </p>
            <div className="mt-4 text-center">
              <Link href="/" className="text-primary hover:underline">
                Go back to homepage
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if shopkeeper is approved by admin
  if (currentUser.role === 'shopkeeper' && (currentUser as any).status !== 'active') {
    const getStatusMessage = () => {
      switch ((currentUser as any).status) {
        case 'pending':
          return {
            title: 'Pending Admin Approval',
            message: 'Your seller account is pending approval from our admin team. You will receive an email notification once your account is approved.',
            color: 'text-yellow-600'
          };
        case 'suspended':
          return {
            title: 'Account Suspended',
            message: 'Your seller account has been suspended. Please contact support for assistance.',
            color: 'text-red-600'
          };
        case 'rejected':
          return {
            title: 'Account Rejected',
            message: 'Your seller account application was rejected. Please contact support for more information.',
            color: 'text-red-600'
          };
        default:
          return {
            title: 'Account Under Review',
            message: 'Your seller account is currently under review. Please check back later.',
            color: 'text-gray-600'
          };
      }
    };

    const statusInfo = getStatusMessage();

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className={`text-center ${statusInfo.color}`}>
              {statusInfo.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-muted-foreground">
              {statusInfo.message}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="outline">
                  Go to Homepage
                </Button>
              </Link>
              <Link href="/account">
                <Button variant="default">
                  View Account Status
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Hub</h1>
                <p className="text-sm text-muted-foreground">{userStore?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  refetchStats();
                  refetchOrders();
                  toast({
                    title: "Dashboard Refreshed",
                    description: "Latest data has been loaded",
                  });
                }}
              >
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="add-product">
              {editingProduct 
                ? (isRestaurant ? "Edit Menu Item" : "Edit Product")
                : (isRestaurant ? "Add Menu Item" : "Add Product")
              }
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {isRestaurant ? "Menu Items" : "Total Products"}
                  </CardTitle>
                  {isRestaurant ? <UtensilsCrossed className="h-4 w-4 text-muted-foreground" /> : <Package className="h-4 w-4 text-muted-foreground" />}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.totalProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +2 from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    {dashboardStats?.pendingOrders || 0} pending orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{dashboardStats?.totalRevenue?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Store Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.averageRating ? Number(dashboardStats.averageRating).toFixed(1) : '0.0'}</div>
                  <p className="text-xs text-muted-foreground">
                    Based on {dashboardStats?.totalReviews || 0} reviews
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Orders Alert */}
            {(dashboardStats?.pendingOrders ?? 0) > 0 && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <AlertCircle className="h-5 w-5" />
                    New Orders Waiting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 dark:text-orange-300">
                        You have <strong>{dashboardStats?.pendingOrders ?? 0}</strong> pending order{(dashboardStats?.pendingOrders ?? 0) > 1 ? 's' : ''} that need{(dashboardStats?.pendingOrders ?? 0) === 1 ? 's' : ''} your attention.
                      </p>
                      <p className="text-sm text-orange-500 dark:text-orange-400 mt-1">
                        Click below to view and process these orders.
                      </p>
                    </div>
                    <Link href="/seller/orders">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Receipt className="h-4 w-4 mr-2" />
                        View Orders
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Button onClick={() => setActiveTab("add-product")} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {isRestaurant ? "Add Menu Item" : "Add Product"}
                  </Button>
                  <Button onClick={() => setActiveTab("products")} variant="outline" className="w-full">
                    {isRestaurant ? <UtensilsCrossed className="h-4 w-4 mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                    {isRestaurant ? "View Menu" : "View Products"}
                  </Button>
                  <Link href="/seller/orders" className="w-full">
                    <Button variant="outline" className="w-full">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Manage Orders
                    </Button>
                  </Link>
                  <Button onClick={() => setActiveTab("analytics")} variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isRestaurant ? "Your Menu Items" : "Your Products"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(products) ? products.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">₹{product.price}</p>
                          <p className="text-sm text-muted-foreground">Stock: {product.stock || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEditProduct(product)} variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDeleteProduct(product.id)} variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-center py-8">No products available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Product Tab */}
          <TabsContent value="add-product" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isRestaurant ? <UtensilsCrossed className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                  {editingProduct 
                    ? (isRestaurant ? "Edit Menu Item" : "Edit Product")
                    : (isRestaurant ? "Add New Menu Item" : "Add New Product")
                  }
                </CardTitle>
                <p className="text-muted-foreground">
                  {editingProduct 
                    ? (isRestaurant ? "Update menu item information" : "Update product information")
                    : (isRestaurant ? "Add items to your restaurant menu" : "Add products to your store inventory")
                  }
                </p>
              </CardHeader>
              <CardContent>
                <Form {...productForm}>
                  <form onSubmit={productForm.handleSubmit(handleAddProduct)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={productForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isRestaurant ? "Menu Item Name *" : "Product Name *"}</FormLabel>
                            <FormControl>
                              <Input placeholder={isRestaurant ? "Enter menu item name" : "Enter product name"} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(categories) && categories.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={productForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter product description"
                              className="min-h-24"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={productForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="originalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={productForm.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter quantity"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={productForm.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <ImageUpload
                            label="Product Images"
                            maxImages={6}
                            minImages={1}
                            onImagesChange={field.onChange}
                            initialImages={field.value || []}
                            className="col-span-full"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {currentStore?.storeType === "restaurant" && (
                      <>
                        <div className="border-t pt-6">
                          <h3 className="text-lg font-medium mb-4 flex items-center">
                            <UtensilsCrossed className="h-5 w-5 mr-2" />
                            Food-Specific Information
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={productForm.control}
                              name="preparationTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Preparation Time</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 15-20 minutes" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={productForm.control}
                              name="spiceLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Spice Level</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select spice level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="mild">Mild</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="hot">Hot</SelectItem>
                                      <SelectItem value="very-hot">Very Hot</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <FormField
                              control={productForm.control}
                              name="isVegetarian"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Vegetarian</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Mark if this item is vegetarian
                                    </div>
                                  </div>
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="rounded"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={productForm.control}
                              name="isVegan"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Vegan</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      Mark if this item is vegan
                                    </div>
                                  </div>
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="rounded"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      {editingProduct ? "Update Product" : "Add Product"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Store Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics data will be displayed here when available.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}