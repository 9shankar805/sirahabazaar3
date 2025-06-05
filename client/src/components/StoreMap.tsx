import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Phone, Star } from "lucide-react";
import type { Store } from "@shared/schema";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different marker types
const storeIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIgZmlsbD0iIzM5ODRmZiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8]
});

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

  // Center coordinates for the map (Siraha, Nepal)
  const defaultCenter: [number, number] = [26.6586, 86.2003];

  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <MapPin className="h-5 w-5" />
            Store Locations & Directions
          </CardTitle>
          <CardDescription>
            Find nearby stores and get directions to them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <Button onClick={getUserLocation} className="flex items-center gap-2 w-full sm:w-auto">
              <Navigation className="h-4 w-4" />
              Get My Location
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Latitude"
                value={manualLocation.lat}
                onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
                className="flex-1 min-w-0"
              />
              <Input
                placeholder="Longitude"
                value={manualLocation.lon}
                onChange={(e) => setManualLocation({ ...manualLocation, lon: e.target.value })}
                className="flex-1 min-w-0"
              />
              <Button onClick={setManualLocationHandler} variant="outline" className="w-full sm:w-auto">
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                <div className="space-y-4 max-h-96 overflow-y-auto">
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
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                        <h3 className="font-semibold text-lg">{store.name}</h3>
                        <Badge variant="secondary" className="self-start">
                          {store.distance.toFixed(1)} km away
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">{store.description}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{store.address}</span>
                        </div>
                        {store.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                            className="flex-1 sm:flex-none"
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
                            className="flex-1 sm:flex-none"
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
                <CardDescription>Store details and interactive map</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64 md:h-80 lg:h-96 bg-gray-100 rounded-lg overflow-hidden">
                  {selectedStore.latitude && selectedStore.longitude ? (
                    <MapContainer
                      center={[parseFloat(selectedStore.latitude), parseFloat(selectedStore.longitude)]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      className="z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[parseFloat(selectedStore.latitude), parseFloat(selectedStore.longitude)]}
                        icon={storeIcon}
                      >
                        <Popup>
                          <div className="text-center">
                            <h3 className="font-semibold">{selectedStore.name}</h3>
                            <p className="text-sm text-gray-600">{selectedStore.address}</p>
                            <p className="text-sm">Rating: {selectedStore.rating} ⭐</p>
                          </div>
                        </Popup>
                      </Marker>
                      {userLocation && (
                        <Marker
                          position={[userLocation.latitude, userLocation.longitude]}
                          icon={userIcon}
                        >
                          <Popup>Your Location</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-500">
                      <div>
                        <MapPin className="h-12 w-12 mx-auto mb-2" />
                        <p>Location coordinates not available</p>
                      </div>
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