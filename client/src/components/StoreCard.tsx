import { Link } from "wouter";
import { MapPin, Star, Clock } from "lucide-react";
import type { Store } from "@shared/schema";

interface StoreCardProps {
  store: Store;
}

export default function StoreCard({ store }: StoreCardProps) {
  return (
    <Link href={`/stores/${store.id}`}>
      <div className="store-card">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            <img
              src={store.logo || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"}
              alt={store.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80";
              }}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{store.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              <span>1.2 km away</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <div className="flex items-center mr-3">
            <Star className="h-4 w-4 text-yellow-400 mr-1" />
            <span>{store.rating} ({store.totalReviews} reviews)</span>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Clock className="h-3 w-3 mr-1" />
          <span>Open: 7:00 AM - 10:00 PM</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {store.description || "Quality products and excellent service"}
        </p>
      </div>
    </Link>
  );
}
