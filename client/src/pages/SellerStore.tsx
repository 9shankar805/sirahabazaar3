import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Store, Edit, MapPin, Phone, Globe, Star, Plus, Camera, Save
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "@/components/ImageUpload";

const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().optional(),
  coverImage: z.string().optional()
});

interface Store {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  website: string;
  logo: string;
  coverImage: string;
  rating: string;
  totalReviews: number;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
}

interface User {
  id: number;
  role: string;
  fullName: string;
  email: string;
}

export default function SellerStore() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Mock current user - in real app this would come from auth context
  useEffect(() => {
    const mockUser: User = {
      id: 1,
      role: "shopkeeper",
      fullName: "Demo Seller",
      email: "seller@demo.com"
    };
    setCurrentUser(mockUser);
  }, []);

  const form = useForm<z.infer<typeof storeSchema>>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      website: "",
      logo: "",
      coverImage: ""
    }
  });

  // Store query
  const { data: stores, isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ['/api/stores/owner', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const userStore = stores?.[0]; // Assuming one store per user for now

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: async (data: z.infer<typeof storeSchema>) => {
      return await apiRequest('/api/stores', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          ownerId: currentUser?.id
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Store Created",
        description: "Your store has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores/owner', currentUser?.id] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create store",
        variant: "destructive"
      });
    }
  });

  // Update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (data: z.infer<typeof storeSchema>) => {
      return await apiRequest(`/api/stores/${userStore?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Store Updated",
        description: "Your store has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores/owner', currentUser?.id] });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update store",
        variant: "destructive"
      });
    }
  });

  const handleCreateStore = (data: z.infer<typeof storeSchema>) => {
    createStoreMutation.mutate(data);
  };

  const handleUpdateStore = (data: z.infer<typeof storeSchema>) => {
    updateStoreMutation.mutate(data);
  };

  const openEditDialog = () => {
    if (userStore) {
      form.reset({
        name: userStore.name,
        description: userStore.description || "",
        address: userStore.address,
        phone: userStore.phone || "",
        website: userStore.website || "",
        logo: userStore.logo || "",
        coverImage: userStore.coverImage || ""
      });
      setIsEditDialogOpen(true);
    }
  };

  const openCreateDialog = () => {
    form.reset();
    setIsCreateDialogOpen(true);
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
              You need to be a shopkeeper to access store management.
            </p>
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Management</h1>
                <p className="text-sm text-muted-foreground">Manage your store information and settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/seller/dashboard">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userStore ? (
          /* Existing Store Management */
          <div className="space-y-6">
            {/* Store Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {userStore.logo ? (
                        <img src={userStore.logo} alt="Store Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{userStore.name}</h2>
                        <p className="text-muted-foreground">{userStore.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm">{parseFloat(userStore.rating).toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">
                              ({userStore.totalReviews} reviews)
                            </span>
                          </div>
                          <Badge variant={userStore.isActive ? 'default' : 'secondary'}>
                            {userStore.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <Button onClick={openEditDialog} className="mt-4 sm:mt-0">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Store
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">{userStore.address}</p>
                    </div>
                  </div>
                  {userStore.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-muted-foreground">{userStore.phone}</p>
                      </div>
                    </div>
                  )}
                  {userStore.website && (
                    <div className="flex items-start space-x-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Website</p>
                        <a 
                          href={userStore.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {userStore.website}
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Store Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{userStore.totalReviews}</p>
                      <p className="text-sm text-muted-foreground">Total Reviews</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{parseFloat(userStore.rating).toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      Store created on {new Date(userStore.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="/seller/products/add">
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </Link>
                  <Link href="/seller/inventory">
                    <Button variant="outline" className="w-full">
                      View Inventory
                    </Button>
                  </Link>
                  <Link href="/seller/orders">
                    <Button variant="outline" className="w-full">
                      Manage Orders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* No Store - Create Store */
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create Your Store</CardTitle>
                <p className="text-muted-foreground">
                  You need to create your store before you can start adding products and managing orders.
                </p>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={openCreateDialog} size="lg" className="w-full sm:w-auto">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Store
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Store Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Your Store</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateStore)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createStoreMutation.isPending}>
                  {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Store Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Store Information</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateStore)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateStoreMutation.isPending}>
                  {updateStoreMutation.isPending ? 'Updating...' : 'Update Store'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}