import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, Clock, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";
import type { Store, Product } from "@shared/schema";

export default function StoreDetail() {
  const { id } = useParams();

  const { data: store, isLoading: storeLoading } = useQuery<Store>({
    queryKey: [`/api/stores/${id}`],
    enabled: !!id,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [`/api/products`, { storeId: id }],
    enabled: !!id,
  });

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div>Loading store...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Store not found</h2>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Store Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Store Image */}
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Store Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-2">{store.name}</h1>
                
                <div className="flex items-center mb-3">
                  <div className="flex text-yellow-400 mr-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(Number(store.rating)) ? "fill-current" : ""
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    {store.rating} ({store.totalReviews} reviews)
                  </span>
                  <Badge variant="secondary" className="ml-3">
                    {store.isActive ? "Open" : "Closed"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Open: 7:00 AM - 10:00 PM</span>
                  </div>
                  {store.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-red-500" />
                    <span>1.2 km away</span>
                  </div>
                </div>

                {store.description && (
                  <p className="text-muted-foreground mb-4">{store.description}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 w-full md:w-auto">
                <Button className="btn-primary">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Store
                </Button>
                <Button variant="outline">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Get ArrowRight
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Products from {store.name}</span>
              <Badge variant="outline">{products.length} products</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No products available at the moment</p>
                <p className="text-muted-foreground text-sm mt-2">Check back later for new arrivals</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Features */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Why Shop with {store.name}?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Fast Delivery</h3>
                <p className="text-sm text-muted-foreground">Quick delivery within Siraha area</p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Quality Products</h3>
                <p className="text-sm text-muted-foreground">Fresh and authentic local products</p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Local Support</h3>
                <p className="text-sm text-muted-foreground">Direct communication with store owner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
