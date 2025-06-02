import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Phone, Star } from "lucide-react";
import type { Store } from "@shared/schema";

interface StoreWithDistance extends Store {
  distance: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

export default function StoreMap() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreWithDistance | null>(null);
  const [manualLocation, setManualLocation] = useState({ lat: "", lon: "" });

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  // Set manual location
  const setManualLocationHandler = () => {
    const lat = parseFloat(manualLocation.lat);
    const lon = parseFloat(manualLocation.lon);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      setUserLocation({ latitude: lat, longitude: lon });
    }
  };

  // Fetch nearby stores when user location is available
  const { data: nearbyStores, isLoading } = useQuery<StoreWithDistance[]>({
    queryKey: ["/api/stores/nearby", userLocation?.latitude, userLocation?.longitude],
    queryFn: async () => {
      if (!userLocation) return [];
      
      const response = await fetch(
        `/api/stores/nearby?lat=${userLocation.latitude}&lon=${userLocation.longitude}`
      );
      if (!response.ok) throw new Error("Failed to fetch nearby stores");
      return response.json();
    },
    enabled: !!userLocation,
  });

  // Generate Google Maps URL for directions
  const getDirectionsUrl = (store: StoreWithDistance) => {
    if (!userLocation) return "#";
    
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${store.latitude},${store.longitude}`;
    
    return `https://www.google.com/maps/dir/${origin}/${destination}`;
  };

  // Generate Google Maps embed URL for store location
  const getMapEmbedUrl = (store: StoreWithDistance) => {
    if (!store.latitude || !store.longitude) return "";
    
    const center = `${store.latitude},${store.longitude}`;
    return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${center}&zoom=15`;
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Store Locations & Directions
          </CardTitle>
          <CardDescription>
            Find nearby stores and get directions to them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={getUserLocation} className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Get My Location
            </Button>
            
            <div className="flex gap-2">
              <Input
                placeholder="Latitude"
                value={manualLocation.lat}
                onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
                className="w-32"
              />
              <Input
                placeholder="Longitude"
                value={manualLocation.lon}
                onChange={(e) => setManualLocation({ ...manualLocation, lon: e.target.value })}
                className="w-32"
              />
              <Button onClick={setManualLocationHandler} variant="outline">
                Set Location
              </Button>
            </div>
          </div>

          {userLocation && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                Your location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {userLocation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nearby Stores</CardTitle>
              <CardDescription>
                Stores sorted by distance from your location
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading nearby stores...</div>
              ) : nearbyStores && nearbyStores.length > 0 ? (
                <div className="space-y-4">
                  {nearbyStores.map((store) => (
                    <div
                      key={store.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedStore?.id === store.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedStore(store)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{store.name}</h3>
                        <Badge variant="secondary">
                          {store.distance.toFixed(1)} km away
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">{store.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{store.address}</span>
                        </div>
                        {store.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">
                            {store.rating} ({store.totalReviews} reviews)
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getDirectionsUrl(store), "_blank");
                            }}
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Directions
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStore(store);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No stores found in your area
                </div>
              )}
            </CardContent>
          </Card>

          {selectedStore && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedStore.name}</CardTitle>
                <CardDescription>Store details and location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  {selectedStore.latitude && selectedStore.longitude ? (
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Location: {selectedStore.latitude}, {selectedStore.longitude}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Google Maps integration requires API key configuration
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-2" />
                      <p>Location coordinates not available</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">Address</h4>
                    <p className="text-gray-600">{selectedStore.address}</p>
                  </div>

                  {selectedStore.phone && (
                    <div>
                      <h4 className="font-semibold mb-1">Phone</h4>
                      <p className="text-gray-600">{selectedStore.phone}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-1">Distance</h4>
                    <p className="text-gray-600">{selectedStore.distance.toFixed(1)} km from your location</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-1">Rating</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{selectedStore.rating}</span>
                      </div>
                      <span className="text-gray-500">({selectedStore.totalReviews} reviews)</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      className="w-full"
                      onClick={() => window.open(getDirectionsUrl(selectedStore), "_blank")}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions in Google Maps
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}