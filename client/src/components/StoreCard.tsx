import { Link } from "wouter";
import { MapPin, Star, Clock } from "lucide-react";
import type { Store } from "@shared/schema";

interface StoreCardProps {
  store: Store;
}

export default function StoreCard({ store }: StoreCardProps) {
  return (
    <Link href={`/stores/${store.id}`}>
      <div className="store-card p-4 sm:p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={store.logo || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"}
              alt={store.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{store.name}</h3>
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{store.address}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-muted-foreground mb-2 gap-1 sm:gap-3">
          <div className="flex items-center">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 mr-1 flex-shrink-0" />
            <span>{store.rating} ({store.totalReviews} reviews)</span>
          </div>
          {store.phone && (
            <div className="flex items-center">
              <span className="hidden sm:inline">•</span>
              <span className="sm:ml-1 truncate">{store.phone}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-3">
          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
          <span>Open: 7:00 AM - 10:00 PM</span>
        </div>
        
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
          {store.description || "Quality products and excellent service"}
        </p>
      </div>
    </Link>
  );
}
