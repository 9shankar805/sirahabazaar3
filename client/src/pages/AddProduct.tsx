import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Upload, Package, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required"),
  originalPrice: z.string().optional(),
  categoryId: z.number().min(1, "Category is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  images: z.array(z.string()).default([]),
  imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  isOnOffer: z.boolean().default(false),
  offerPercentage: z.number().min(0).max(100).default(0),
  offerEndDate: z.string().optional(),
  productType: z.enum(["retail", "food"]).default("retail"),
  preparationTime: z.string().optional(),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  spiceLevel: z.string().optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  nutritionInfo: z.string().optional(),
  isFastSell: z.boolean().default(false),
});

type ProductForm = z.infer<typeof productSchema>;

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Store {
  id: number;
  name: string;
  storeType: string;
}

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [newAllergen, setNewAllergen] = useState("");

  // Categories query
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Store query to get current store info
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: [`/api/stores/owner`, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/stores/owner/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch stores');
      return response.json();
    },
    enabled: !!user,
  });

  const currentStore = stores[0]; // Assuming one store per shopkeeper

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      categoryId: 1,
      stock: 0,
      images: [],
      imageUrl: "",
      isOnOffer: false,
      offerPercentage: 0,
      offerEndDate: "",
      productType: "retail",
      preparationTime: "",
      ingredients: [],
      allergens: [],
      spiceLevel: "",
      isVegetarian: false,
      isVegan: false,
      nutritionInfo: "",
      isFastSell: false,
    },
  });

  const watchProductType = form.watch("productType");
  const watchIsOnOffer = form.watch("isOnOffer");
  const watchImageUrl = form.watch("imageUrl");

  const handleAddIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      const updated = [...ingredients, newIngredient.trim()];
      setIngredients(updated);
      form.setValue("ingredients", updated);
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    const updated = ingredients.filter(i => i !== ingredient);
    setIngredients(updated);
    form.setValue("ingredients", updated);
  };

  const handleAddAllergen = () => {
    if (newAllergen.trim() && !allergens.includes(newAllergen.trim())) {
      const updated = [...allergens, newAllergen.trim()];
      setAllergens(updated);
      form.setValue("allergens", updated);
      setNewAllergen("");
    }
  };

  const handleRemoveAllergen = (allergen: string) => {
    const updated = allergens.filter(a => a !== allergen);
    setAllergens(updated);
    form.setValue("allergens", updated);
  };

  const handleAddImage = () => {
    const imageUrl = form.getValues("imageUrl");
    if (imageUrl && imageUrl.trim()) {
      const currentImages = form.getValues("images");
      if (!currentImages.includes(imageUrl.trim())) {
        form.setValue("images", [...currentImages, imageUrl.trim()]);
        form.setValue("imageUrl", "");
      }
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    const currentImages = form.getValues("images");
    form.setValue("images", currentImages.filter(img => img !== imageUrl));
  };

  const onSubmit = async (data: ProductForm) => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "Please create a store first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = {
        ...data,
        storeId: currentStore.id,
        ingredients,
        allergens,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      toast({ title: "Product added successfully!" });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/products/store/${currentStore.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Navigate back to inventory
      setLocation("/seller/inventory");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'shopkeeper') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You need to be a shopkeeper to add products.
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

  if (!currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Store Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              You need to create a store before adding products.
            </p>
            <div className="flex justify-center">
              <Link href="/seller/store">
                <Button>Create Store</Button>
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
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Link href="/seller/inventory">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Back</span>
                </Button>
              </Link>
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  Add Product
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block truncate">
                  Add to {currentStore.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="p-2 sm:px-3"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only sm:not-sr-only sm:ml-2">
                  {showPreview ? "Hide" : "Preview"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className={`grid gap-4 sm:gap-6 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          {/* Product Form */}
          <Card className="order-2 lg:order-1">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Package className="h-5 w-5 mr-2" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    
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
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your product" 
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Category</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                              <FormControl>
                                <SelectTrigger className="h-11 sm:h-10">
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
                        name="productType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Product Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 sm:h-10">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="retail">Retail Product</SelectItem>
                                <SelectItem value="food">Food Item</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Pricing & Stock */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Pricing & Stock</h3>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                className="h-11 sm:h-10 text-base" 
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
                            <FormLabel className="text-sm font-medium">Original Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                className="h-11 sm:h-10 text-base" 
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
                            <FormLabel className="text-sm font-medium">Stock Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="h-11 sm:h-10 text-base" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Offer Settings */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isOnOffer"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Special Offer</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Enable special pricing for this product
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {watchIsOnOffer && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="offerPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Discount Percentage</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0" 
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
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Product Images</h3>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                placeholder="Enter image URL" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAddImage}
                        disabled={!watchImageUrl || !watchImageUrl.trim()}
                        className="whitespace-nowrap"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                    </div>

                    {/* Image Preview */}
                    {form.watch("images").length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {form.watch("images").map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={imageUrl} 
                              alt={`Product ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder-image.png";
                              }}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              onClick={() => handleRemoveImage(imageUrl)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Food-specific fields */}
                  {watchProductType === "food" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Food Information</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="preparationTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preparation Time</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 15-20 mins" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="spiceLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spice Level</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select spice level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="mild">Mild</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="hot">Hot</SelectItem>
                                  <SelectItem value="extra-hot">Extra Hot</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Ingredients */}
                      <div className="space-y-2">
                        <FormLabel>Ingredients</FormLabel>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input 
                            placeholder="Add ingredient"
                            value={newIngredient}
                            onChange={(e) => setNewIngredient(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleAddIngredient}
                            className="whitespace-nowrap"
                          >
                            Add
                          </Button>
                        </div>
                        {ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {ingredients.map((ingredient) => (
                              <Badge key={ingredient} variant="secondary" className="cursor-pointer">
                                {ingredient}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredient(ingredient)}
                                  className="ml-2 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Allergens */}
                      <div className="space-y-2">
                        <FormLabel>Allergens</FormLabel>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input 
                            placeholder="Add allergen"
                            value={newAllergen}
                            onChange={(e) => setNewAllergen(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergen())}
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleAddAllergen}
                            className="whitespace-nowrap"
                          >
                            Add
                          </Button>
                        </div>
                        {allergens.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {allergens.map((allergen) => (
                              <Badge key={allergen} variant="destructive" className="cursor-pointer">
                                {allergen}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAllergen(allergen)}
                                  className="ml-2 hover:text-white"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dietary Options */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <FormField
                          control={form.control}
                          name="isVegetarian"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Vegetarian</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isVegan"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Vegan</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="nutritionInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nutrition Information (JSON)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder='{"calories": 450, "protein": "25g", "carbs": "30g"}' 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Additional Options */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isFastSell"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Fast Sell Product</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Mark as a fast-selling popular item
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none h-12 sm:h-10 text-base font-medium"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Adding Product..." : "Add Product"}
                    </Button>
                    <Link href="/seller/inventory" className="flex-1 sm:flex-none">
                      <Button type="button" variant="outline" className="w-full h-12 sm:h-10 text-base">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          {showPreview && (
            <Card className="order-1 lg:order-2 lg:sticky lg:top-24 lg:h-fit">
              <CardHeader>
                <CardTitle>Product Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                    {form.watch("images")[0] ? (
                      <img 
                        src={form.watch("images")[0]} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-image.png";
                        }}
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">
                      {form.watch("name") || "Product Name"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {form.watch("description") || "Product description will appear here..."}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-primary">
                      ${form.watch("price") || "0.00"}
                    </span>
                    {form.watch("originalPrice") && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${form.watch("originalPrice")}
                      </span>
                    )}
                  </div>

                  {form.watch("isOnOffer") && form.watch("offerPercentage") > 0 && (
                    <Badge variant="destructive">
                      {form.watch("offerPercentage")}% OFF
                    </Badge>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Stock: {form.watch("stock")} units
                  </div>

                  {form.watch("productType") === "food" && (
                    <div className="space-y-2 text-sm">
                      {form.watch("preparationTime") && (
                        <div>Prep time: {form.watch("preparationTime")}</div>
                      )}
                      {form.watch("spiceLevel") && (
                        <div>Spice level: {form.watch("spiceLevel")}</div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {form.watch("isVegetarian") && (
                          <Badge variant="outline" className="text-green-600">Vegetarian</Badge>
                        )}
                        {form.watch("isVegan") && (
                          <Badge variant="outline" className="text-green-600">Vegan</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}