import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import StoreCard from "@/components/StoreCard";
import type { Product, Store, Category } from "@shared/schema";

export default function Homepage() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const featuredProducts = products?.slice(0, 6) || [];
  const popularStores = stores?.slice(0, 4) || [];

  // Food category icons mapping
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      "Fruits & Vegetables": "🍎",
      "Dairy & Eggs": "🥛",
      "Meat & Seafood": "🍖",
      "Bakery & Bread": "🍞",
      "Grains & Cereals": "🌾",
      "Spices & Condiments": "🌶️",
      "Beverages": "☕",
      "Snacks & Sweets": "🍪",
      "Cooking Oil & Ghee": "🫒",
      "Frozen Foods": "🧊",
      "Ready to Cook": "🍜",
      "Organic Foods": "🌱"
    };
    return iconMap[categoryName] || "🛒";
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-80 md:h-96 hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              Siraha Bazaar
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Discover fresh products from local vendors in your neighborhood
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button className="btn-primary text-lg">
                  Start Shopping
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/stores">
                <Button variant="outline" className="text-lg border-primary text-primary hover:bg-primary hover:text-white">
                  Browse Stores
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-10 text-center">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories?.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <div className="category-card text-center hover:transform hover:scale-105 transition-transform duration-200 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-4xl mb-3">{getCategoryIcon(category.name)}</div>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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
