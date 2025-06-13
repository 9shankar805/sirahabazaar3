import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Truck, Upload, FileText, CreditCard, Navigation, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUserLocation } from "@/lib/distance";

const deliveryPartnerApplicationSchema = z.object({
  vehicleType: z.string().min(1, "Vehicle type is required"),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  drivingLicense: z.string().min(1, "Driving license number is required"),
  idProofType: z.string().min(1, "ID proof type is required"),
  idProofNumber: z.string().min(1, "ID proof number is required"),
  deliveryAreas: z.string().min(1, "Delivery areas are required"),
  emergencyContact: z.string().min(10, "Emergency contact must be at least 10 digits"),
  bankAccountNumber: z.string().min(8, "Bank account number must be at least 8 digits"),
  ifscCode: z.string().min(11, "IFSC code must be 11 characters").max(11),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
  address: z.string().min(1, "Address is required"),
});

type DeliveryPartnerApplicationForm = z.infer<typeof deliveryPartnerApplicationSchema>;

interface DeliveryPartnerApplicationProps {
  onSuccess: () => void;
}

export default function DeliveryPartnerApplication({ onSuccess }: DeliveryPartnerApplicationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  const form = useForm<DeliveryPartnerApplicationForm>({
    resolver: zodResolver(deliveryPartnerApplicationSchema),
    defaultValues: {
      vehicleType: "",
      vehicleNumber: "",
      drivingLicense: "",
      idProofType: "",
      idProofNumber: "",
      deliveryAreas: "",
      emergencyContact: "",
      bankAccountNumber: "",
      ifscCode: "",
      termsAccepted: false,
      address: "",
    },
  });

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_HERE_API_KEY;
      if (!apiKey) {
        throw new Error('HERE Maps API key not configured');
      }

      const response = await fetch(
        `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to reverse geocode location');
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const address = data.items[0];
        return address.title || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }

      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const getMyLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentUserLocation();
      setUserLocation(location);

      const address = await reverseGeocode(location.latitude, location.longitude);
      form.setValue("address", address);

      toast({
        title: "Location Found",
        description: `Your address has been set to: ${address}`,
      });

    } catch (error) {
      console.error("Error getting location:", error);
      toast({
        title: "Location Error",
        description: error instanceof Error ? error.message : "Failed to get your location. Please ensure location permission is granted.",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };


  const onSubmit = async (data: DeliveryPartnerApplicationForm) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please log in to apply as a delivery partner.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const deliveryPartnerData = {
        userId: user.id,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        drivingLicense: data.drivingLicense,
        idProofType: data.idProofType,
        idProofNumber: data.idProofNumber,
        deliveryAreas: data.deliveryAreas.split(',').map(area => area.trim()),
        emergencyContact: data.emergencyContact,
        bankAccountNumber: data.bankAccountNumber,
        ifscCode: data.ifscCode,
        address: data.address,
      };

      const response = await fetch('/api/delivery-partners/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryPartnerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Application submission failed');
      }

      toast({
        title: "Application Submitted!",
        description: "Your delivery partner application has been submitted successfully. You'll be notified once it's reviewed.",
      });

      onSuccess();
    } catch (error) {
      console.error('Application submission error:', error);
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Truck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Become a Delivery Partner</CardTitle>
          <CardDescription>
            Join our delivery network and start earning. Fill out the form below to apply.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Vehicle Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Vehicle Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bike">Bike</SelectItem>
                            <SelectItem value="scooter">Scooter</SelectItem>
                            <SelectItem value="bicycle">Bicycle</SelectItem>
                            <SelectItem value="car">Car</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicleNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., BA-01-XX-1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="drivingLicense"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driving License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your driving license number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Identity Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Identity Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="idProofType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Proof Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ID proof type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aadhar">Aadhar Card</SelectItem>
                            <SelectItem value="pan">PAN Card</SelectItem>
                            <SelectItem value="voter">Voter ID</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idProofNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Proof Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter ID proof number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Service Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Service Information</h3>
                </div>

                <FormField
                  control={form.control}
                  name="deliveryAreas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Areas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter areas you can deliver to (comma separated) e.g., Siraha, Lahan, Mirchaiya" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter emergency contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Banking Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Banking Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bank account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter IFSC code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Address Information</h3>
                </div>

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Textarea
                              placeholder="Enter your full address or use current location"
                              className="flex-1"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            onClick={getMyLocation}
                            disabled={isGettingLocation}
                            variant="outline"
                            className="min-w-[44px] self-start mt-0"
                          >
                            {isGettingLocation ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            ) : (
                              <Navigation className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {userLocation && (
                          <FormMessage>
                            Using your current location ({userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)})
                          </FormMessage>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              {/* Terms and Conditions */}
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I accept the terms and conditions for delivery partners
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading || isGettingLocation}>
                {isLoading ? "Submitting Application..." : "Submit Application"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}