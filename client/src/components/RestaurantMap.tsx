import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Star, Clock, Bike } from "lucide-react";
import type { Store } from "@shared/schema";
import "leaflet/dist/leaflet.css";

// Fix leaflet default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RestaurantMapProps {
  selectedRestaurant?: Store | null;
  onRestaurantSelect?: (restaurant: Store) => void;
}

export default function RestaurantMap({ selectedRestaurant, onRestaurantSelect }: RestaurantMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([26.7606, 88.0414]); // Siraha coordinates

  const { data: restaurants } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    select: (data) => data?.filter(store => store.storeType === 'restaurant') || []
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.log("Error getting location:", error);
        }
      );
    }
  }, []);

  const restaurantIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const userIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const handleGetDirections = (restaurant: Store) => {
    if (userLocation && restaurant.latitude && restaurant.longitude) {
      const url = `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${restaurant.latitude},${restaurant.longitude}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/${encodeURIComponent(restaurant.address)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="w-full h-[500px] relative rounded-lg overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Restaurant markers */}
        {restaurants?.map((restaurant) => {
          if (!restaurant.latitude || !restaurant.longitude) return null;
          
          const lat = parseFloat(restaurant.latitude);
          const lng = parseFloat(restaurant.longitude);
          
          if (isNaN(lat) || isNaN(lng)) return null;
          
          return (
            <Marker
              key={restaurant.id}
              position={[lat, lng]}
              icon={restaurantIcon}
              eventHandlers={{
                click: () => {
                  onRestaurantSelect?.(restaurant);
                }
              }}
            >
              <Popup>
                <Card className="w-64 border-0 shadow-none">
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-red-600">
                          {restaurant.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {restaurant.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{restaurant.rating}</span>
                        </div>
                        {restaurant.deliveryTime && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{restaurant.deliveryTime}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {restaurant.cuisineType && (
                          <Badge variant="outline" className="text-xs">
                            {restaurant.cuisineType}
                          </Badge>
                        )}
                        {restaurant.isDeliveryAvailable && (
                          <Badge className="bg-green-500 text-xs">
                            <Bike className="h-3 w-3 mr-1" />
                            Delivery
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{restaurant.address}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          className="w-full bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => window.open(`/restaurants/${restaurant.id}`, '_blank')}
                        >
                          View Menu
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleGetDirections(restaurant)}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}