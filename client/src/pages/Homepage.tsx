import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import StoreCard from "@/components/StoreCard";
import type { Product, Store } from "@shared/schema";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Homepage() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const featuredProducts = products?.slice(0, 6) || [];
  const popularStores = stores?.slice(0, 4) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Slider Section */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
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
            <div className="relative h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative text-center text-white px-4 max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                  From Click to Doorstep — In Just One Hour
                </h1>
                <p className="text-lg md:text-xl mb-6 font-medium opacity-90">
                  Shop fast. Get it faster.
                </p>
                <Link href="/products">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-4 rounded-full font-semibold">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </SwiperSlide>

          {/* Slide 2 - Food Delivery */}
          <SwiperSlide>
            <div className="relative h-full bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/25"></div>
              <div className="relative text-center text-white px-4 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
                  Hot & Fresh – Tasty Food at Your Doorstep
                </h1>
                <p className="text-xl md:text-3xl mb-8 font-medium opacity-90">
                  Delicious meals delivered within the hour.
                </p>
                <Link href="/products?category=1">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-4 rounded-full font-semibold">
                    Order Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </SwiperSlide>

          {/* Slide 3 - Limited Offers */}
          <SwiperSlide>
            <div className="relative h-full bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative text-center text-white px-4 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
                  Grab the Offer Fast – Limited Time Only!
                </h1>
                <p className="text-xl md:text-3xl mb-8 font-medium opacity-90">
                  Deals you can't miss.
                </p>
                <Link href="/products">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-4 rounded-full font-semibold">
                    Grab Deal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      {/* Categories */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">Shop by Category</h2>
            <Link href="/categories">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                View All Categories
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Food", icon: "🍎", href: "/products?category=1" },
              { name: "Groceries", icon: "🛒", href: "/products?category=2" },
              { name: "Electronics", icon: "📱", href: "/products?category=4" },
              { name: "Clothing", icon: "👕", href: "/products?category=5" },
            ].map((category) => (
              <Link key={category.name} href={category.href}>
                <div className="category-card text-center">
                  <div className="text-3xl mb-3">{category.icon}</div>
                  <div className="text-sm font-semibold text-foreground">{category.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">Featured Products</h2>
            <Link href="/products">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                View All Products
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Stores */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-10 text-center">Popular Local Stores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {popularStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
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
