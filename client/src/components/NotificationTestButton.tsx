import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Send, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

export function NotificationTestButton() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    title: 'Test Notification',
    message: 'This is a test push notification from Siraha Bazaar!',
    type: 'test'
  });

  const handleSendTestNotification = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to test notifications",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: testData.title,
          message: testData.message,
          type: testData.type,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test notification sent successfully!",
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
    } finally {
      setIsLoading(false);
    }
  };

  // Only show in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="border-dashed border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-800">Test Push Notifications</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          Development testing tool for Firebase push notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-2 bg-orange-100 rounded-md">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-700">
            This is a development tool and won't appear in production
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="test-title">Notification Title</Label>
            <Input
              id="test-title"
              value={testData.title}
              onChange={(e) => setTestData({ ...testData, title: e.target.value })}
              placeholder="Enter notification title"
            />
          </div>

          <div>
            <Label htmlFor="test-message">Notification Message</Label>
            <Textarea
              id="test-message"
              value={testData.message}
              onChange={(e) => setTestData({ ...testData, message: e.target.value })}
              placeholder="Enter notification message"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="test-type">Notification Type</Label>
            <Input
              id="test-type"
              value={testData.type}
              onChange={(e) => setTestData({ ...testData, type: e.target.value })}
              placeholder="test, order_update, promotion, etc."
            />
          </div>
        </div>

        <Button 
          onClick={handleSendTestNotification}
          disabled={isLoading || !user?.id}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Test Notification
            </>
          )}
        </Button>

        {!user?.id && (
          <p className="text-sm text-orange-600 text-center">
            Please log in to test notifications
          </p>
        )}
      </CardContent>
    </Card>
  );
}