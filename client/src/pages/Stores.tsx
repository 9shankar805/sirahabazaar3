import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Star, Clock, Phone, Globe, Filter } from "lucide-react";
import { Link } from "wouter";
import StoreCard from "@/components/StoreCard";
import type { Store } from "@shared/schema";

export default function Stores() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: stores, isLoading } = useQuery({
    queryKey: ["/api/stores"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality could be implemented here
  };

  const filteredStores = Array.isArray(stores) ? stores.filter((store: Store) => {
    const matchesSearch = searchQuery === "" || 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) : [];

  const getStoreHours = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour < 21) {
      return { status: "Open", color: "bg-green-100 text-green-800" };
    }
    return { status: "Closed", color: "bg-red-100 text-red-800" };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Stores</h1>
        <p className="text-muted-foreground">
          Discover local stores and businesses in your area
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search stores by name, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>

      {/* Store Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Stores</p>
                <p className="text-2xl font-bold">{Array.isArray(stores) ? stores.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Open Now</p>
                <p className="text-2xl font-bold">
                  {Array.isArray(stores) ? stores.filter(() => getStoreHours().status === "Open").length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Featured</p>
                <p className="text-2xl font-bold">
                  {Array.isArray(stores) ? stores.filter((store: Store) => store.featured).length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stores Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store: Store) => {
            const hours = getStoreHours();
            return (
              <Card key={store.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{store.name}</h3>
                      <Badge className={hours.color} variant="secondary">
                        {hours.status}
                      </Badge>
                    </div>
                    {store.featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {store.description || "No description available"}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {store.address && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{store.address}</span>
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{store.phone}</span>
                      </div>
                    )}
                    {store.website && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={store.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/stores/${store.id}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        View Store
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stores found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No stores match your search for "${searchQuery}"`
                : "No stores are available at the moment"
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mt-12 text-center">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold mb-2">Want to list your store?</h3>
            <p className="text-muted-foreground mb-4">
              Join our platform and reach more customers in your area
            </p>
            <Link href="/register">
              <Button>
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}