import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { Truck, Package, DollarSign, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ['/api/delivery-partners/user', user?.id],
    enabled: !!user?.id,
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['/api/deliveries/partner', partner?.id],
    enabled: !!partner?.id,
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ deliveryId, status }: { deliveryId: number; status: string }) => {
      return apiRequest(`/api/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        body: { status, partnerId: partner?.id },
      });
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
      return apiRequest(`/api/delivery-partners/${partner?.id}`, {
        method: 'PUT',
        body: { isAvailable },
      });
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
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Not a Delivery Partner</CardTitle>
            <CardDescription>
              You haven't applied to become a delivery partner yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/register?role=delivery_partner'}>
              Apply to Become a Delivery Partner
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

  const pendingDeliveries = deliveries.filter((d: Delivery) => d.status === 'assigned');
  const activeDeliveries = deliveries.filter((d: Delivery) => d.status === 'picked_up');
  const completedDeliveries = deliveries.filter((d: Delivery) => d.status === 'delivered');

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