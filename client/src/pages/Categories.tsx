import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Categories() {
  const categories = [
    { name: "Food", icon: "🍎", href: "/products?category=1" },
    { name: "Groceries", icon: "🛒", href: "/products?category=2" },
    { name: "Fancy Items", icon: "💎", href: "/products?category=3" },
    { name: "Electronics", icon: "📱", href: "/products?category=4" },
    { name: "Clothing", icon: "👕", href: "/products?category=5" },
    { name: "Books", icon: "📚", href: "/products?category=6" },
    { name: "Sports", icon: "⚽", href: "/products?category=7" },
    { name: "Beauty", icon: "💄", href: "/products?category=8" },
    { name: "Toys", icon: "🧸", href: "/products?category=9" },
    { name: "Health", icon: "🏥", href: "/products?category=10" },
    { name: "Automotive", icon: "🚗", href: "/products?category=11" },
    { name: "Garden", icon: "🌱", href: "/products?category=12" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">All Categories</h1>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {categories.map((category) => (
            <Link key={category.name} href={category.href}>
              <div className="category-card text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{category.icon}</div>
                <div className="text-sm font-semibold text-foreground">{category.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}