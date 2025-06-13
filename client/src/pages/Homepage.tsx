import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, Star, MapPin, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProductCard from "@/components/ProductCard";
import StoreCard from "@/components/StoreCard";
import { useAuth } from "@/hooks/useAuth";
import { useAppMode } from "@/hooks/useAppMode";
import type { Product, Store } from "@shared/schema";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { useEffect } from "react";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


export default function Homepage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { mode } = useAppMode();

  // Redirect sellers to their dashboard
  useEffect(() => {
    if (!isLoading && user?.role === "shopkeeper") {
      setLocation("/seller/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const shoppingCategories = [
    { name: "Electronics", icon: "📱", href: "/products?category=4" },
    { name: "Clothing", icon: "👕", href: "/products?category=5" },
    { name: "Home & Garden", icon: "🏠", href: "/products?category=3" },
    { name: "Books", icon: "📚", href: "/products?category=6" },
  ];

  const foodCategories = [
    { name: "Indian Cuisine", icon: "🍛", href: "/products?category=food&cuisine=indian" },
    { name: "Fast Food", icon: "🍔", href: "/products?category=food&cuisine=fast-food" },
    { name: "Pizza", icon: "🍕", href: "/products?category=food&type=pizza" },
    { name: "Desserts", icon: "🍰", href: "/products?category=food&cuisine=desserts" },
  ];

  const categories = mode === 'shopping' ? shoppingCategories : foodCategories;
  
  const { data: products, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: stores, isLoading: storesLoading, error: storesError, refetch: refetchStores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Enhanced error logging with more context
  if (productsError) {
    console.error("Products loading failed:", {
      error: productsError,
      message: productsError instanceof Error ? productsError.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
  if (storesError) {
    console.error("Stores loading failed:", {
      error: storesError,
      message: storesError instanceof Error ? storesError.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
  if (products) console.log("Products loaded:", products.length);
  if (stores) console.log("Stores loaded:", stores.length);

  const featuredProducts = products?.filter(product => mode === 'shopping' ? product.productType !== 'food' : product.productType === 'food').slice(0, 6) || [];
  const popularStores = stores?.filter(store => mode === 'shopping' ? store.storeType !== 'restaurant' : store.storeType === 'restaurant').slice(0, 4) || [];

  // Error handling component for products
  const ProductsErrorState = () => (
    <div className="text-center py-12">
      <Alert className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load products. Please try again.
        </AlertDescription>
      </Alert>
      <Button 
        onClick={() => refetchProducts()} 
        variant="outline" 
        className="mt-4"
        disabled={productsLoading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${productsLoading ? 'animate-spin' : ''}`} />
        Retry
      </Button>
    </div>
  );

  // Loading state component for products
  const ProductsLoadingState = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-4">
            <div className="bg-gray-200 h-32 rounded-md mb-3"></div>
            <div className="bg-gray-200 h-4 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 rounded w-3/4"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Error handling component for stores
  const StoresErrorState = () => (
    <div className="text-center py-12">
      <Alert className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load stores. Please try again.
        </AlertDescription>
      </Alert>
      <Button 
        onClick={() => refetchStores()} 
        variant="outline" 
        className="mt-4"
        disabled={storesLoading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${storesLoading ? 'animate-spin' : ''}`} />
        Retry
      </Button>
    </div>
  );

  // Loading state component for stores
  const StoresLoadingState = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-6">
            <div className="bg-gray-200 h-24 rounded-md mb-4"></div>
            <div className="bg-gray-200 h-5 rounded mb-2"></div>
            <div className="bg-gray-200 h-4 rounded w-2/3 mb-2"></div>
            <div className="bg-gray-200 h-3 rounded w-1/2"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Slider Section */}
      <section className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          className="h-full"
        >
          {/* Slide 1 - Fast Delivery */}
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center" style={{
              backgroundImage: `url(/attached_assets/slider2_1749495663488.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  From Click to Doorstep — In Just One Hour
                </h1>
                <p className="text-base sm:text-lg md:text-xl mb-6 font-medium opacity-90">
                  Shop fast. Get it faster.
                </p>
                <Link href="/products">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </SwiperSlide>

          {/* Slide 2 - Food Delivery */}
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center" style={{
              backgroundImage: `url(/attached_assets/slider1_1749496287701.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
              <div className="absolute inset-0 bg-black/25"></div>
              <div className="relative text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                  Hot & Fresh – Tasty Food at Your Doorstep
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 font-medium opacity-90">
                  Delicious meals delivered within the hour.
                </p>
                <Link href="/products?category=1">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold">
                    Order Now
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </SwiperSlide>

          {/* Slide 3 - Limited Offers */}
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center" style={{
              backgroundImage: `url(/attached_assets/slider2_1749495663488.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                  Grab the Offer Fast – Limited Time Only!
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 font-medium opacity-90">
                  Deals you can't miss.
                </p>
                <Link href="/products">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold">
                    Grab Deal
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      {/* Categories/Menu */}
      <section className="py-8 sm:py-12 lg:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-10 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {mode === 'shopping' ? 'Categories' : 'Menu'}
            </h2>
            <Link href={mode === 'shopping' ? "/categories" : "/food-categories"}>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-8 h-8 p-0">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {categories.map((category) => (
              <Link key={category.name} href={category.href}>
                <div className="category-card flex items-center gap-2 p-2 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow min-h-[60px]">
                  <div className="text-xs sm:text-sm font-semibold text-foreground flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{category.name}</div>
                  <div className="text-lg sm:text-2xl flex-shrink-0">{category.icon}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-8 sm:py-12 lg:py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-10 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Products</h2>
            <Link href="/products">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-8 h-8 p-0">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
          {productsError ? (
            <ProductsErrorState />
          ) : productsLoading ? (
            <ProductsLoadingState />
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No featured products available at the moment</p>
              <p className="text-muted-foreground text-sm mt-2">Check back later for new arrivals</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              {featuredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Stores */}
      <section className="py-8 sm:py-12 lg:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-10 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Stores</h2>
            <Link href="/stores">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-8 h-8 p-0">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
          {storesError ? (
            <StoresErrorState />
          ) : storesLoading ? (
            <StoresLoadingState />
          ) : popularStores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No stores available at the moment</p>
              <p className="text-muted-foreground text-sm mt-2">Check back later for new stores</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {popularStores.map((store: any) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Flash Deals Banner */}
      <section className="py-8 bg-accent">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">⚡ Flash Deals - Up to 50% Off!</h2>
            <p className="text-lg mb-4">Limited time offers on selected products</p>
            <Link href="/products">
              <Button variant="outline" className="bg-white text-accent hover:bg-gray-100">
                Shop Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
