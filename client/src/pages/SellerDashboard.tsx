import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Store, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown,
  Users, Star, Eye, BarChart3, PieChart, Activity, Settings,
  Plus, Edit, Trash2, Search, Filter, Download, Calendar, UtensilsCrossed
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

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  averageRating: number;
  totalReviews: number;
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

  // Dashboard stats query
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/seller/dashboard', currentUser?.id],
    queryFn: () => fetch(`/api/seller/dashboard?userId=${currentUser?.id}`).then(res => res.json()),
    enabled: !!currentUser?.id,
  });

  // Analytics query
  const { data: analytics, isLoading: analyticsLoading } = useQuery<StoreAnalytics[]>({
    queryKey: ['/api/seller/analytics', currentUser?.id, selectedPeriod],
    queryFn: () => fetch(`/api/seller/analytics?userId=${currentUser?.id}&days=${selectedPeriod}`).then(res => res.json()),
    enabled: !!currentUser?.id,
  });

  // Products query
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products/store', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await fetch(`/api/products/store?userId=${currentUser.id}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!currentUser?.id,
  });

  // Orders query
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders/store', currentUser?.id],
    queryFn: () => fetch(`/api/orders/store?userId=${currentUser?.id}`).then(res => res.json()),
    enabled: !!currentUser?.id,
  });

  // Categories query
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

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

  // Prepare chart data
  const revenueData = analytics?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(item.revenue),
    orders: item.ordersCount,
    visitors: item.uniqueVisitors
  })) || [];

  const conversionData = analytics?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    rate: parseFloat(item.conversionRate),
    views: item.pageViews,
    addToCart: item.addToCartCount
  })) || [];

  const trafficSources = [
    { name: 'Direct', value: 35, color: '#8884d8' },
    { name: 'Search', value: 25, color: '#82ca9d' },
    { name: 'Social', value: 20, color: '#ffc658' },
    { name: 'Referral', value: 20, color: '#ff7300' },
  ];

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
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
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
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{dashboardStats?.totalRevenue.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.pendingOrders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {(dashboardStats?.pendingOrders || 0) > 0 ? 'Needs attention' : 'All caught up!'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rating & Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Store Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold">{dashboardStats?.averageRating ? Number(dashboardStats.averageRating).toFixed(1) : '0.0'}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (dashboardStats?.averageRating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {dashboardStats?.totalReviews || 0} reviews
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/seller/products/add">
                  <Button className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </Link>
                <Link href="/seller/orders">
                  <Button variant="outline" className="w-full" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    View Orders
                  </Button>
                </Link>
                <Link href="/seller/promotions">
                  <Button variant="outline" className="w-full" size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Promotions
                  </Button>
                </Link>
                <Link href="/seller/settings">
                  <Button variant="outline" className="w-full" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
            <TabsTrigger value="traffic">Traffic Analytics</TabsTrigger>
            <TabsTrigger value="conversion">Conversion Rate</TabsTrigger>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Orders Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Revenue (₹)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Orders"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={trafficSources}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {trafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visitor Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="visitors"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Unique Visitors"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="views" fill="#8884d8" name="Page Views" />
                    <Bar yAxisId="left" dataKey="addToCart" fill="#82ca9d" name="Add to Cart" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rate"
                      stroke="#ff7300"
                      strokeWidth={2}
                      name="Conversion Rate (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(products) ? products.slice(0, 5).map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-primary font-semibold">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">₹{product.price}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Stock: {product.stock || 0}</p>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-sm">{product.rating || '0.0'}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground">No products available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(orders) ? orders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{order.totalAmount}</p>
                    <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}