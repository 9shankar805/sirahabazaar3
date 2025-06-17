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
    const testNotification = async () => {
    try {
      // Play sound first
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {
        console.log('Could not play notification sound');
      });

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          title: 'Test Notification',
          message: 'This is a test notification with sound!',
          type: 'info'
        }),
      });

      if (response.ok) {
        toast({
          title: "Test notification sent!",
          description: "Check your notifications panel and listen for the sound.",
        });
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
  };

    try {
      await testNotification();
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