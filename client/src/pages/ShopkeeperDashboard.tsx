import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Star, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  TrendingUp,
  Users,
  Clock,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiPut, apiDelete } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import ImageUpload from "@/components/ImageUpload";
import type { Product, Order, OrderItem, Store, Category } from "@shared/schema";

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
});

const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().optional(),
  coverImage: z.string().optional()
});

type ProductForm = z.infer<typeof productSchema>;
type StoreForm = z.infer<typeof storeSchema>;

export default function ShopkeeperDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Queries
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: [`/api/stores`, { ownerId: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/stores`);
      if (!response.ok) throw new Error('Failed to fetch stores');
      const allStores = await response.json();
      return allStores.filter((store: Store) => store.ownerId === user?.id);
    },
    enabled: !!user,
  });

  const currentStore = stores[0]; // Assuming one store per shopkeeper

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [`/api/products/store/${currentStore?.id}`],
    queryFn: async () => {
      if (!currentStore?.id) return [];
      const response = await fetch(`/api/products/store/${currentStore.id}`);
      if (!response.ok) throw new Error('Failed to fetch store products');
      return response.json();
    },
    enabled: !!currentStore,
  });

  const { data: orders = [] } = useQuery<(Order & { items: OrderItem[] })[]>({
    queryKey: [`/api/orders/store/${currentStore?.id}`],
    queryFn: async () => {
      if (!currentStore?.id) return [];
      const response = await fetch(`/api/orders/store/${currentStore.id}`);
      if (!response.ok) throw new Error('Failed to fetch store orders');
      return response.json();
    },
    enabled: !!currentStore,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Form for adding/editing products
  const form = useForm<ProductForm>({
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
    },
  });

  // Form for creating stores
  const storeForm = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      website: "",
      logo: "",
      coverImage: ""
    },
  });

  // Stats calculations
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const pendingOrders = orders.filter(order => order.status === "pending").length;

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
      };

      if (editingProduct) {
        await apiPut(`/api/products/${editingProduct.id}`, productData);
        toast({ title: "Product updated successfully" });
      } else {
        await apiPost("/api/products", productData);
        toast({ title: "Product added successfully" });
      }

      form.reset();
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
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
      await apiDelete(`/api/products/${productId}`);
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

  const handleCreateStore = async (data: StoreForm) => {
    try {
      const storeData = {
        ...data,
        ownerId: user!.id,
        phone: data.phone || null,
        description: data.description || null,
        website: data.website || null,
      };

      await apiPost("/api/stores", storeData);
      toast({ title: "Store created successfully" });
      storeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores", "owner", user!.id] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create store",
        variant: "destructive",
      });
    }
  };



  const handleOrderStatusUpdate = async (orderId: number, status: string) => {
    try {
      await apiPut(`/api/orders/${orderId}/status`, { status });
      toast({ title: "Order status updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  if (!user || user.role !== "shopkeeper") {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">This page is only accessible to shopkeepers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Shopkeeper Dashboard</h1>
            <p className="text-muted-foreground">
              {currentStore ? `Managing ${currentStore.name}` : "Manage your store"}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${currentStore ? 'grid-cols-5' : 'grid-cols-2'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {!currentStore && (
              <TabsTrigger value="create-store">Create Store</TabsTrigger>
            )}
            {currentStore && (
              <>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="add-product">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold">{totalProducts}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{totalOrders}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                      <p className="text-2xl font-bold">{pendingOrders}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{Number(order.totalAmount).toLocaleString()}</p>
                          <Badge variant={
                            order.status === "delivered" ? "default" :
                            order.status === "shipped" ? "secondary" :
                            order.status === "processing" ? "outline" : "destructive"
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Add New Product
                </CardTitle>
                <p className="text-muted-foreground">
                  Add products to your store inventory
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddProduct)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter product name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
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
                                {categories.map((category) => (
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
                      control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                      control={form.control}
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

                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      {editingProduct ? "Update Product" : "Add Product"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Store Tab */}
          <TabsContent value="create-store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Your Store</CardTitle>
                <p className="text-muted-foreground">
                  Set up your store to start selling products on Siraha Bazaar
                </p>
              </CardHeader>
              <CardContent>
                <Form {...storeForm}>
                  <form onSubmit={storeForm.handleSubmit(handleCreateStore)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={storeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store Name</FormLabel>
                            <FormControl>
                              <Input placeholder="My Awesome Store" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={storeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Tell customers about your store..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={storeForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Complete store address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={storeForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://mystore.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={storeForm.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <ImageUpload
                              label="Store Logo"
                              single={true}
                              maxImages={1}
                              minImages={0}
                              onImagesChange={(images) => field.onChange(images[0] || "")}
                              initialImages={field.value ? [field.value] : []}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="coverImage"
                        render={({ field }) => (
                          <FormItem>
                            <ImageUpload
                              label="Store Cover Image"
                              single={true}
                              maxImages={1}
                              minImages={0}
                              onImagesChange={(images) => field.onChange(images[0] || "")}
                              initialImages={field.value ? [field.value] : []}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Create Store
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Manage Products</span>
                  <Button onClick={() => setActiveTab("add-product")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No products added yet</p>
                    <Button className="mt-4" onClick={() => setActiveTab("add-product")}>
                      Add Your First Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <img
                          src={product.images?.[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Price: ₹{Number(product.price).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Stock: {product.stock} units
                          </p>
                          <div className="flex gap-2 mt-2">
                            {product.isFastSell && (
                              <Badge variant="destructive" className="text-xs">
                                🔥 Fast Sell
                              </Badge>
                            )}
                            {product.isOnOffer && (
                              <Badge variant="secondary" className="text-xs">
                                🏷️ {product.offerPercentage}% OFF
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add/Edit Product Tab */}
          <TabsContent value="add-product" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddProduct)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter product name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
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

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter price" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="originalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original Price (₹) - Optional</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter original price" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
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
                      control={form.control}
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

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter product description"
                              className="min-h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Special Features Section */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <h3 className="font-medium text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Special Features
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="isFastSell"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  Fast Sell Product
                                </FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Mark as fast-selling/trending item
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="w-4 h-4"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isOnOffer"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  Special Offer
                                </FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Apply discount offer
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="w-4 h-4"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch("isOnOffer") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name="offerPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Discount Percentage (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Enter discount percentage"
                                    min="0"
                                    max="100"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="offerEndDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Offer End Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-4">
                      <Button type="submit" className="btn-primary">
                        {editingProduct ? "Update Product" : "Add Product"}
                      </Button>
                      {editingProduct && (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setEditingProduct(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <p className="text-sm text-muted-foreground">
                              {order.customerName} • {order.phone}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              ₹{Number(order.totalAmount).toLocaleString()}
                            </p>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleOrderStatusUpdate(order.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div>
                          <p className="text-sm font-medium mb-2">Delivery Address:</p>
                          <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
