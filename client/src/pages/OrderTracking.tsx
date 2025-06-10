import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Truck, MapPin, Calendar, DollarSign, User, CheckCircle2, Circle, Clock, Home } from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: number;
  customerId: number;
  totalAmount: string;
  status: string;
  shippingAddress: string;
  paymentMethod: string;
  phone: string;
  customerName: string;
  latitude?: string;
  longitude?: string;
  createdAt: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  storeId: number;
  product?: {
    id: number;
    name: string;
    imageUrl: string;
  };
}

interface OrderTracking {
  id: number;
  orderId: number;
  status: string;
  description: string;
  location?: string;
  updatedAt: string;
}

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
  });

  const { data: tracking, isLoading: trackingLoading } = useQuery<OrderTracking[]>({
    queryKey: ['/api/orders', orderId, 'tracking'],
    enabled: !!orderId,
  });

  if (orderLoading || trackingLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-500">The order you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
      case 'in production':
        return 'bg-blue-500';
      case 'shipped':
      case 'ocean transit':
        return 'bg-purple-500';
      case 'out for delivery':
      case 'shipping final mile':
        return 'bg-orange-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Order Placed';
      case 'processing':
        return 'In Production';
      case 'shipped':
        return 'Ocean Transit';
      case 'out for delivery':
        return 'Shipping Final Mile';
      case 'delivered':
        return 'Delivered';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const trackingSteps = [
    { key: 'pending', label: 'Order Placed', icon: CheckCircle2 },
    { key: 'processing', label: 'In Production', icon: Package },
    { key: 'shipped', label: 'Ocean Transit', icon: Truck },
    { key: 'out_for_delivery', label: 'Shipping Final Mile', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Home }
  ];

  const getCurrentStepIndex = () => {
    const status = order.status.toLowerCase();
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'out for delivery': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();
  const estimatedDeliveryDate = new Date(order.createdAt);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7); // Add 7 days for delivery

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ORDER TRACKING PAGE</h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Please note that these are accurate but not guaranteed estimates. Delivery date is subject to change without advance notice.
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-8 border-2">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-700 mb-1">ORDER PLACED</h3>
                <p className="text-lg font-medium">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-700 mb-1">TOTAL</h3>
                <p className="text-lg font-medium">₹{parseFloat(order.totalAmount).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-700 mb-1">SHIP TO</h3>
                <p className="text-lg font-medium">{order.customerName}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-700 mb-1">ORDER</h3>
                <p className="text-lg font-medium">#{order.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Status: <span className="text-green-600">{getStatusText(order.status)}</span>
          </h2>
          <p className="text-gray-600">
            Estimated Delivery Date: {format(estimatedDeliveryDate, 'dd MMM - dd MMM')}
          </p>
        </div>

        {/* Progress Timeline */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%` }}
                ></div>
              </div>

              {/* Steps */}
              <div className="relative grid grid-cols-5 gap-4">
                {trackingSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="text-center">
                      {/* Icon Circle */}
                      <div className={`
                        relative mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3
                        ${isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-400'
                        }
                        ${isCurrent ? 'ring-4 ring-green-200' : ''}
                      `}>
                        <StepIcon className="w-6 h-6" />
                      </div>

                      {/* Label */}
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        {step.label}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-gray-500">
                        {index === 0 ? format(new Date(order.createdAt), 'MMM dd, yyyy') :
                         index <= currentStepIndex ? format(new Date(order.createdAt), 'MMM dd, yyyy') :
                         format(estimatedDeliveryDate, 'MMM dd, yyyy')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product?.name || `Product #${item.productId}`}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{parseFloat(item.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipping Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Ship Address</h4>
                <p className="text-gray-600">{order.shippingAddress}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Customer Name</h4>
                <p className="text-gray-600">{order.customerName}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Phone</h4>
                <p className="text-gray-600">{order.phone}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Payment Method</h4>
                <p className="text-gray-600 capitalize">{order.paymentMethod}</p>
              </div>
            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Map integration coming soon</p>
                  {order.latitude && order.longitude && (
                    <p className="text-xs text-gray-400 mt-2">
                      Coordinates: {order.latitude}, {order.longitude}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tracking History */}
        {tracking && tracking.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tracking History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tracking.map((track, index) => (
                  <div key={track.id} className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(track.status)}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">{track.status}</h4>
                        <span className="text-sm text-gray-500">
                          {format(new Date(track.updatedAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      {track.description && (
                        <p className="text-gray-600 text-sm mt-1">{track.description}</p>
                      )}
                      {track.location && (
                        <p className="text-gray-500 text-xs mt-1">Location: {track.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;