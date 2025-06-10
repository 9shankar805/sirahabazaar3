import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { Truck, Package, DollarSign, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DeliveryPartnerApplication from "@/components/DeliveryPartnerApplication";

interface DeliveryPartner {
  id: number;
  userId: number;
  vehicleType: string;
  vehicleNumber: string;
  drivingLicense: string;
  idProofType: string;
  idProofNumber: string;
  deliveryAreas: string[];
  emergencyContact: string;
  bankAccountNumber: string;
  ifscCode: string;
  status: string;
  isAvailable: boolean;
  currentLocation: string | null;
  totalDeliveries: number;
  totalEarnings: string;
  rating: number | null;
  createdAt: string;
}

interface Delivery {
  id: number;
  orderId: number;
  deliveryFee: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDistance: number;
  status: string;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  customerFeedback: string | null;
  customerRating: number | null;
  createdAt: string;
}

export default function DeliveryPartnerDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApplication, setShowApplication] = useState(false);

  const { data: partner, isLoading: partnerLoading, error: partnerError } = useQuery({
    queryKey: ['/api/delivery-partners/user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/delivery-partners/user?userId=${user?.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Partner not found is a valid state
        }
        throw new Error('Failed to fetch partner data');
      }
      return response.json();
    },
    enabled: !!user?.id,
    retry: 2,
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/deliveries/partner', partner?.id],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries/partner/${partner?.id}`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!partner?.id,
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ deliveryId, status }: { deliveryId: number; status: string }) => {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, partnerId: partner?.id }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/partner'] });
      toast({
        title: "Status Updated",
        description: "Delivery status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update delivery status.",
        variant: "destructive",
      });
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      const response = await fetch(`/api/delivery-partners/${partner?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery-partners/user'] });
      toast({
        title: "Availability Updated",
        description: "Your availability status has been updated.",
      });
    },
  });

  if (partnerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    if (showApplication) {
      return (
        <DeliveryPartnerApplication 
          onSuccess={() => {
            setShowApplication(false);
            queryClient.invalidateQueries({ queryKey: ['/api/delivery-partners/user'] });
          }} 
        />
      );
    }

    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Truck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Become a Delivery Partner</CardTitle>
            <CardDescription className="text-base">
              Join our delivery network and start earning money by delivering orders to customers in your area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800 dark:text-green-400">Earn Money</h3>
                <p className="text-sm text-green-600 dark:text-green-300">Flexible earnings based on deliveries</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-400">Flexible Hours</h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">Work when you want</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-800 dark:text-purple-400">Local Area</h3>
                <p className="text-sm text-purple-600 dark:text-purple-300">Deliver in your neighborhood</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">What you need:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Valid driving license
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Vehicle (bike, scooter, car, or bicycle)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Valid ID proof
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Bank account for payments
                </li>
              </ul>
            </div>

            <Button 
              onClick={() => setShowApplication(true)} 
              className="w-full"
              size="lg"
            >
              Apply Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (partner.status === 'pending') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Application Under Review
            </CardTitle>
            <CardDescription>
              Your delivery partner application is being reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>We'll notify you once your application is approved.</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Vehicle Type:</strong> {partner.vehicleType}
                </div>
                <div>
                  <strong>Vehicle Number:</strong> {partner.vehicleNumber}
                </div>
                <div>
                  <strong>ID Proof:</strong> {partner.idProofType} - {partner.idProofNumber}
                </div>
                <div>
                  <strong>Delivery Areas:</strong> {partner.deliveryAreas.join(', ')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (partner.status === 'rejected') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Application Rejected
            </CardTitle>
            <CardDescription>
              Unfortunately, your delivery partner application was not approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please contact support for more information or to reapply.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deliveriesArray = Array.isArray(deliveries) ? deliveries : [];
  const pendingDeliveries = deliveriesArray.filter((d: Delivery) => d.status === 'assigned');
  const activeDeliveries = deliveriesArray.filter((d: Delivery) => d.status === 'picked_up');
  const completedDeliveries = deliveriesArray.filter((d: Delivery) => d.status === 'delivered');

  const totalEarnings = completedDeliveries.reduce((sum: number, delivery: Delivery) => 
    sum + parseFloat(delivery.deliveryFee), 0
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Delivery Partner Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.fullName}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={partner.isAvailable ? "default" : "secondary"}>
            {partner.isAvailable ? "Available" : "Offline"}
          </Badge>
          <Button
            variant={partner.isAvailable ? "outline" : "default"}
            onClick={() => toggleAvailability.mutate(!partner.isAvailable)}
            disabled={toggleAvailability.isPending}
          >
            {partner.isAvailable ? "Go Offline" : "Go Online"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partner.totalDeliveries}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDeliveries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partner.rating ? `${partner.rating.toFixed(1)}★` : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingDeliveries.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeDeliveries.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedDeliveries.length})</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingDeliveries.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending deliveries</p>
              </CardContent>
            </Card>
          ) : (
            pendingDeliveries.map((delivery: Delivery) => (
              <Card key={delivery.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order #{delivery.orderId}</CardTitle>
                    <Badge variant="secondary">{delivery.status}</Badge>
                  </div>
                  <CardDescription>
                    Delivery Fee: ₹{delivery.deliveryFee} • Distance: {delivery.estimatedDistance}km
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <p className="font-medium">Pickup</p>
                        <p className="text-sm text-muted-foreground">{delivery.pickupAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-500 mt-1" />
                      <div>
                        <p className="font-medium">Delivery</p>
                        <p className="text-sm text-muted-foreground">{delivery.deliveryAddress}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateDeliveryStatus.mutate({ deliveryId: delivery.id, status: 'picked_up' })}
                        disabled={updateDeliveryStatus.isPending}
                      >
                        Accept & Pickup
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeDeliveries.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active deliveries</p>
              </CardContent>
            </Card>
          ) : (
            activeDeliveries.map((delivery: Delivery) => (
              <Card key={delivery.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order #{delivery.orderId}</CardTitle>
                    <Badge variant="default">{delivery.status}</Badge>
                  </div>
                  <CardDescription>
                    Delivery Fee: ₹{delivery.deliveryFee} • Distance: {delivery.estimatedDistance}km
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-500 mt-1" />
                      <div>
                        <p className="font-medium">Delivery Address</p>
                        <p className="text-sm text-muted-foreground">{delivery.deliveryAddress}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => updateDeliveryStatus.mutate({ deliveryId: delivery.id, status: 'delivered' })}
                      disabled={updateDeliveryStatus.isPending}
                      className="w-full"
                    >
                      Mark as Delivered
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedDeliveries.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed deliveries yet</p>
              </CardContent>
            </Card>
          ) : (
            completedDeliveries.map((delivery: Delivery) => (
              <Card key={delivery.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order #{delivery.orderId}</CardTitle>
                    <Badge variant="outline">Completed</Badge>
                  </div>
                  <CardDescription>
                    Delivered on {new Date(delivery.deliveredAt!).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Earnings: ₹{delivery.deliveryFee}</p>
                      {delivery.customerRating && (
                        <p className="text-sm text-muted-foreground">
                          Customer Rating: {delivery.customerRating}★
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Vehicle Type:</strong> {partner.vehicleType}
                </div>
                <div>
                  <strong>Vehicle Number:</strong> {partner.vehicleNumber}
                </div>
                <div>
                  <strong>Driving License:</strong> {partner.drivingLicense}
                </div>
                <div>
                  <strong>ID Proof:</strong> {partner.idProofType} - {partner.idProofNumber}
                </div>
                <div className="col-span-2">
                  <strong>Delivery Areas:</strong> {partner.deliveryAreas.join(', ')}
                </div>
                <div>
                  <strong>Emergency Contact:</strong> {partner.emergencyContact}
                </div>
                <div>
                  <strong>Bank Account:</strong> {partner.bankAccountNumber}
                </div>
                <div>
                  <strong>IFSC Code:</strong> {partner.ifscCode}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Badge className="ml-2" variant={partner.status === 'approved' ? 'default' : 'secondary'}>
                    {partner.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}