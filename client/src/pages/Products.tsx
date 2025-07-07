import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DistanceBasedProductSearch from "@/components/DistanceBasedProductSearch";
import { useAppMode } from "@/hooks/useAppMode";

export default function Products() {
  const [location] = useLocation();
  const { mode } = useAppMode();
  const [searchParams, setSearchParams] = useState(new URLSearchParams(location.split('?')[1] || ''));

  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category');

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    setSearchParams(params);
    console.log("Products page location changed:", { 
      location, 
      searchQuery: params.get('search'), 
      categoryQuery: params.get('category'),
      fullURL: window.location.href 
    });
  }, [location]);

  console.log("Products page rendering with:", { searchQuery, categoryQuery });

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Use the new distance-based product search component */}
        <DistanceBasedProductSearch 
          searchQuery={searchQuery}
          category={categoryQuery || ""}
        />
      </div>
    </div>
  );
}