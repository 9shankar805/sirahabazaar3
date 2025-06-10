import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function NotificationTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleTestNotification = async () => {
    if (!user?.id) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to test notifications",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        toast({
          title: "Test notification sent",
          description: "Check the mobile notification bar at the top",
        });
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTestNotification}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="fixed bottom-20 right-4 z-40 md:hidden"
    >
      <Bell className="h-4 w-4 mr-2" />
      {isLoading ? 'Sending...' : 'Test Notification'}
    </Button>
  );
}