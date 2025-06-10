import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Truck, MapPin, Navigation, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";
import { DeliveryCalculator } from "@/components/DeliveryCalculator";
import { calculateDistance, getCoordinatesFromAddress } from "@/lib/distance";
import { useQuery } from "@tanstack/react-query";

const checkoutSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  shippingAddress: z.string().min(10, "Address is required"),
  paymentMethod: z.enum(["cod", "card", "upi"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(0);
  const [, setLocation] = useLocation();
  const { cartItems, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: user?.fullName || "",
      phone: user?.phone || "",
      shippingAddress: "",
      paymentMethod: "cod",
      latitude: undefined,
      longitude: undefined,
    },
  });

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      form.setValue("latitude", latitude);
      form.setValue("longitude", longitude);

      // Use Nominatim (OpenStreetMap) for reverse geocoding - free and reliable
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.display_name) {
            form.setValue("shippingAddress", data.display_name);
          } else {
            // Fallback: use coordinates as address
            form.setValue("shippingAddress", `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
          }
        } else {
          form.setValue("shippingAddress", `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
        }
      } catch (geocodeError) {
        // Fallback: use coordinates as address if geocoding fails
        form.setValue("shippingAddress", `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
      }

      toast({
        title: "Location captured",
        description: "Your location has been automatically filled.",
      });
    } catch (error) {
      toast({
        title: "Location access denied",
        description: "Please enter your address manually or enable location permissions.",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (!user || cartItems.length === 0) return;

    setIsLoading(true);
    try {
      const orderData = {
        customerId: user.id,
        totalAmount: totalAmount.toString(),
        status: "pending",
        ...data,
      };

      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product?.price || "0",
        storeId: item.product?.storeId || 0,
      }));

      const response = await apiPost("/api/orders", {
        order: orderData,
        items: orderItems,
      }) as { order?: { id: number } };

      // Store order ID for tracking
      if (response.order?.id) {
        localStorage.setItem('lastOrderId', response.order.id.toString());
      }

      await clearCart();
      
      toast({
        title: "Order placed successfully!",
        description: "You will receive a confirmation email shortly.",
      });

      // Redirect with order ID in URL
      const orderParam = response.order?.id ? `?orderId=${response.order.id}` : '';
      setLocation(`/order-confirmation${orderParam}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (cartItems.length === 0) {
    setLocation("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Delivery Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complete Address</FormLabel>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleGetLocation}
                                disabled={isGettingLocation}
                                className="flex items-center gap-2"
                              >
                                <Navigation className="h-4 w-4" />
                                {isGettingLocation ? "Getting Location..." : "Get My Location"}
                              </Button>
                              <span className="text-sm text-muted-foreground flex items-center">
                                Auto-fill your current address
                              </span>
                            </div>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter your complete delivery address or use 'Get My Location'"
                                className="min-h-20"
                                {...field} 
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="space-y-3"
                            >
                              <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                                <RadioGroupItem value="cod" id="cod" />
                                <Label htmlFor="cod" className="flex-1 cursor-pointer">
                                  <div className="flex items-center">
                                    <Truck className="h-5 w-5 mr-3 text-green-600" />
                                    <div>
                                      <div className="font-medium">Cash on Delivery</div>
                                      <div className="text-sm text-muted-foreground">
                                        Pay when you receive your order
                                      </div>
                                    </div>
                                  </div>
                                </Label>
                              </div>
                              
                              <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                                <RadioGroupItem value="card" id="card" />
                                <Label htmlFor="card" className="flex-1 cursor-pointer">
                                  <div className="flex items-center">
                                    <CreditCard className="h-5 w-5 mr-3 text-blue-600" />
                                    <div>
                                      <div className="font-medium">Credit/Debit Card</div>
                                      <div className="text-sm text-muted-foreground">
                                        Pay with your card securely
                                      </div>
                                    </div>
                                  </div>
                                </Label>
                              </div>
                              
                              <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                                <RadioGroupItem value="upi" id="upi" />
                                <Label htmlFor="upi" className="flex-1 cursor-pointer">
                                  <div className="flex items-center">
                                    <div className="h-5 w-5 mr-3 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                                      U
                                    </div>
                                    <div>
                                      <div className="font-medium">UPI Payment</div>
                                      <div className="text-sm text-muted-foreground">
                                        Pay using UPI apps like eSewa, Khalti
                                      </div>
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button 
                  type="submit" 
                  className="w-full btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Placing Order..." : "Place Order"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <span>{item.product?.name || "Unknown Product"}</span>
                        <span className="text-muted-foreground"> x{item.quantity}</span>
                      </div>
                      <span>₹{item.product ? (Number(item.product.price) * item.quantity).toLocaleString() : 0}</span>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="text-accent">FREE</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>₹0</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  By placing this order, you agree to our Terms of Service and Privacy Policy.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
