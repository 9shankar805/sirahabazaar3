import { Link } from "wouter";
import { Minus, Plus, X, ShoppingBag, MapPin, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { calculateDistance, getCoordinatesFromAddress, formatDistance } from "@/lib/distance";
import { useQuery } from "@tanstack/react-query";

export default function Cart() {
  const { cartItems, updateCartItem, removeFromCart, totalAmount, totalItems, isLoading } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{
    zone: any;
    estimatedTime: number;
  } | null>(null);

  const { data: deliveryZones = [] } = useQuery({
    queryKey: ["/api/delivery-zones"],
  });

  const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
    try {
      await updateCartItem(cartItemId, newQuantity);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      await removeFromCart(cartItemId);
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const calculateDeliveryFee = async () => {
    if (!deliveryAddress.trim() || cartItems.length === 0) return;

    setIsCalculatingFee(true);
    try {
      // Get store address from first item (assuming single store for now)
      const firstItem = cartItems[0];
      if (!firstItem?.product) {
        throw new Error("Product information not available");
      }

      // For demo purposes, using mock store coordinates
      // In real implementation, you'd get this from the store data
      const storeCoords = { latitude: 26.6618, longitude: 86.2025 }; // Siraha, Nepal
      const customerCoords = await getCoordinatesFromAddress(deliveryAddress);

      if (!customerCoords) {
        throw new Error("Could not find location coordinates for the delivery address");
      }

      // Calculate distance
      const distance = calculateDistance(storeCoords, customerCoords);
      setDeliveryDistance(distance);

      // Calculate fee using API
      const response = await fetch("/api/calculate-delivery-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distance }),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate delivery fee");
      }

      const result = await response.json();
      setDeliveryFee(result.fee);
      setDeliveryInfo({
        zone: result.zone,
        estimatedTime: Math.round(30 + (distance * 10)) // Base 30min + 10min per km
      });

      toast({
        title: "Delivery Fee Calculated",
        description: `₹${result.fee} for ${formatDistance(distance)} delivery`,
      });

    } catch (error) {
      console.error("Error calculating delivery fee:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to calculate delivery fee",
        variant: "destructive",
      });
    } finally {
      setIsCalculatingFee(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please Login</h2>
            <p className="text-muted-foreground mb-4">
              You need to login to view your cart
            </p>
            <Link href="/login">
              <Button className="w-full">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div>Loading cart...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-4">
                Looks like you haven't added anything to your cart yet
              </p>
              <Link href="/products">
                <Button>Continue Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items ({totalItems})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <img
                        src={item.product?.images?.[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                        alt={item.product?.name || "Product"}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2">
                          {item.product?.name || "Unknown Product"}
                        </h3>
                        <p className="text-primary font-semibold text-sm sm:text-base">
                          ₹{item.product ? Number(item.product.price).toLocaleString() : 0}
                        </p>
                      </div>
                      
                      {/* Mobile Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-destructive hover:text-destructive sm:hidden"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end sm:space-x-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.product?.stock || 0)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <p className="font-semibold text-sm sm:text-base">
                          ₹{item.product ? (Number(item.product.price) * item.quantity).toLocaleString() : 0}
                        </p>
                        
                        {/* Desktop Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive hidden sm:flex"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Delivery Address Input */}
                <div className="space-y-3 mb-4">
                  <div>
                    <Label htmlFor="delivery-address" className="text-sm font-medium">
                      Delivery Address
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="delivery-address"
                        placeholder="Enter delivery address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={calculateDeliveryFee}
                        disabled={isCalculatingFee || !deliveryAddress.trim()}
                        size="sm"
                        variant="outline"
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
                    {deliveryDistance > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Distance: {formatDistance(deliveryDistance)}
                        {deliveryInfo && ` • Est. ${deliveryInfo.estimatedTime} mins`}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee > 0 ? "text-foreground" : "text-accent"}>
                      {deliveryFee > 0 ? `₹${deliveryFee.toLocaleString()}` : "FREE"}
                    </span>
                  </div>
                  {deliveryInfo?.zone && (
                    <div className="text-xs text-muted-foreground">
                      Zone: {deliveryInfo.zone.name}
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{(totalAmount + deliveryFee).toLocaleString()}</span>
                  </div>
                </div>
                
                <Link href="/checkout">
                  <Button className="w-full btn-primary">
                    Proceed to Checkout
                  </Button>
                </Link>
                
                <Link href="/products">
                  <Button variant="outline" className="w-full mt-3">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
