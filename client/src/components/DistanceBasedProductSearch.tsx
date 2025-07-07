import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentUserLocation } from "@/lib/distance";
import ProductCard from "@/components/ProductCard";
import type { Product, Store } from "@shared/schema";

interface ProductWithDistance extends Product {
  storeDistance?: number;
  storeName?: string;
  deliveryTime?: string;
}

interface DistanceBasedProductSearchProps {
  searchQuery?: string;
  category?: string;
  className?: string;
}

export default function DistanceBasedProductSearch({ 
  searchQuery = "", 
  category = "",
  className = ""
}: DistanceBasedProductSearchProps) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sortBy, setSortBy] = useState<string>("distance");
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get user location
  const getUserLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentUserLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Failed to get user location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  // Debug logging for search functionality
  useEffect(() => {
    console.log("DistanceBasedProductSearch received props:", { 
      searchQuery, 
      category,
      searchQueryLength: searchQuery.length,
      searchQueryTrimmed: searchQuery.trim()
    });
  }, [searchQuery, category]);

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { search: searchQuery, category }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (category) params.append('category', category);
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  // Fetch stores for distance calculation
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  // Calculate distances and enrich products
  const enrichedProducts: ProductWithDistance[] = products.map((product) => {
    const store = stores.find((s) => s.id === product.storeId);
    let distance = undefined;
    
    if (userLocation && store?.latitude && store?.longitude) {
      const storeLatitude = parseFloat(store.latitude);
      const storeLongitude = parseFloat(store.longitude);
      
      if (!isNaN(storeLatitude) && !isNaN(storeLongitude)) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (storeLatitude - userLocation.latitude) * Math.PI / 180;
        const dLon = (storeLongitude - userLocation.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(storeLatitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }
    }
    
    return {
      ...product,
      storeDistance: distance,
      storeName: store?.name || 'Unknown Store',
      deliveryTime: store?.deliveryTime || '30-45 min'
    };
  });

  // Filter and sort products
  const filteredAndSortedProducts = enrichedProducts
    .filter((product) => {
      // Filter by search query first - this should be the MAIN filter
      if (searchQuery && searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase().trim();
        const nameMatch = product.name.toLowerCase().includes(searchLower);
        const descriptionMatch = product.description?.toLowerCase().includes(searchLower);
        const categoryMatch = product.category?.toLowerCase().includes(searchLower);
        
        console.log(`Filtering product "${product.name}" with search "${searchQuery}":`, {
          nameMatch, descriptionMatch, categoryMatch,
          name: product.name,
          description: product.description,
          category: product.category
        });
        
        // If we have a search query, ONLY show products that match it
        const matchesSearch = nameMatch || descriptionMatch || categoryMatch;
        if (!matchesSearch) {
          console.log(`❌ Product "${product.name}" filtered out - no match`);
          return false;
        }
        console.log(`✅ Product "${product.name}" included - matches search`);
      }
      
      // Filter by category if provided (secondary filter)
      if (category && category.trim()) {
        const categoryLower = category.toLowerCase();
        if (!product.category?.toLowerCase().includes(categoryLower)) {
          return false;
        }
      }
      
      // Filter by distance if location is available (tertiary filter)
      if (userLocation && product.storeDistance !== undefined) {
        return product.storeDistance <= maxDistance;
      }
      
      // If no search query, show all products (or filtered by category/distance only)
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "distance":
          if (!userLocation) return 0;
          const distA = a.storeDistance ?? Infinity;
          const distB = b.storeDistance ?? Infinity;
          return distA - distB;
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "rating":
          return Number(b.rating) - Number(a.rating);
        default:
          return 0;
      }
    });

  const FilterControls = () => (
    <div className="space-y-4">
      {/* Location Status */}
      <div className="space-y-2">
        <Label>Location</Label>
        {!userLocation ? (
          <Button 
            onClick={getUserLocation} 
            disabled={isGettingLocation}
            variant="outline"
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isGettingLocation ? "Getting Location..." : "Get My Location"}
          </Button>
        ) : (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Location Found
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Distance Filter */}
      {userLocation && (
        <div className="space-y-2">
          <Label>Maximum Distance (km)</Label>
          <Select value={maxDistance.toString()} onValueChange={(value) => setMaxDistance(Number(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Within 1 km</SelectItem>
              <SelectItem value="3">Within 3 km</SelectItem>
              <SelectItem value="5">Within 5 km</SelectItem>
              <SelectItem value="10">Within 10 km</SelectItem>
              <SelectItem value="20">Within 20 km</SelectItem>
              <SelectItem value="50">Within 50 km</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sort Options */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {userLocation && <SelectItem value="distance">Nearest First</SelectItem>}
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {/* Header with Filter Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">
            {searchQuery ? `Search results for "${searchQuery}"` : "Products"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {userLocation 
              ? `Showing ${filteredAndSortedProducts.length} products sorted by distance`
              : `Showing ${filteredAndSortedProducts.length} products`
            }
            {searchQuery && ` • Searching for: "${searchQuery}"`}
          </p>
        </div>

        {/* Mobile Filter Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filter & Sort
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter & Sort Products</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterControls />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters Sidebar */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterControls />
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded mb-1"></div>
                  <div className="bg-gray-200 h-3 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredAndSortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {userLocation 
                  ? "Try increasing the distance range or adjusting your search."
                  : "Try different search terms or enable location access for distance-based results."
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Products Grid */}
      <div className="lg:hidden">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-32 rounded-lg mb-2"></div>
                <div className="bg-gray-200 h-4 rounded mb-1"></div>
                <div className="bg-gray-200 h-3 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm">
              {userLocation 
                ? "Try increasing the distance range or adjusting your search."
                : "Try different search terms or enable location access for distance-based results."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}