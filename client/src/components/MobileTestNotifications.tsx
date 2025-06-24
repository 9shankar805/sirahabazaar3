import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Send, Package, Truck, Gift, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { useQueryClient } from '@tanstack/react-query';

export default function MobileTestNotifications() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendTestNotification = async (type: string, title: string, message: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to test notifications",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title,
          message,
          type,
        }),
      });

      if (response.ok) {
        // Refresh notifications immediately
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/user', user.id] });
        
        toast({
          title: "Success",
          description: "Test notification sent! Check the notification bell.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send test notification',
        variant: "destructive"
      });
    }
  };

  // Only show in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="border-dashed border-2 border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-purple-800">Mobile Notification Testing</CardTitle>
        </div>
        <CardDescription className="text-purple-700">
          Test different types of notifications for mobile interface
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            onClick={() => sendTestNotification(
              'order_update', 
              'Order Confirmed 📦', 
              'Your order #12345 has been confirmed and is being prepared by the store.'
            )}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-xs"
          >
            <Package className="h-3 w-3 mr-1" />
            Order Update
          </Button>

          <Button 
            onClick={() => sendTestNotification(
              'delivery_assignment', 
              'Delivery Update 🚚', 
              'Your delivery partner is on the way. Estimated arrival: 15 minutes.'
            )}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-xs"
          >
            <Truck className="h-3 w-3 mr-1" />
            Delivery Alert
          </Button>

          <Button 
            onClick={() => sendTestNotification(
              'promotion', 
              'Special Offer! 🎉', 
              'Get 20% off on your next order. Use code SAVE20. Limited time offer!'
            )}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-xs"
          >
            <Gift className="h-3 w-3 mr-1" />
            Promotion
          </Button>

          <Button 
            onClick={() => sendTestNotification(
              'mobile_test', 
              'Mobile Test 📱', 
              'This is a test notification specifically for mobile interface testing.'
            )}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-xs"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Mobile Test
          </Button>
        </div>

        <div className="text-xs text-purple-600 mt-3 p-2 bg-purple-100 rounded">
          <p className="font-semibold mb-1">How to test:</p>
          <ul className="space-y-1">
            <li>• Click any button above to send a test notification</li>
            <li>• Look for the bell icon in the navbar (should show red badge)</li>
            <li>• Click the bell to open the mobile notification center</li>
            <li>• Notifications refresh every 3 seconds automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}