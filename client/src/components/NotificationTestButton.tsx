import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function NotificationTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSoundTesting, setIsSoundTesting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleTestSound = async () => {
    setIsSoundTesting(true);
    
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.8;
      
      await audio.play();
      
      toast({
        title: "🔊 Sound Test",
        description: "Did you hear the notification sound?",
      });
    } catch (error) {
      console.error('Error playing sound:', error);
      toast({
        title: "Sound Test Failed",
        description: "Could not play notification sound. Check if audio is enabled.",
        variant: "destructive",
      });
    } finally {
      setIsSoundTesting(false);
    }
  };

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
    <div className="fixed bottom-20 right-4 z-40 md:hidden flex flex-col gap-2">
      <Button
        onClick={handleTestSound}
        disabled={isSoundTesting}
        variant="outline"
        size="sm"
        className="bg-blue-500 text-white hover:bg-blue-600"
      >
        🔊 {isSoundTesting ? 'Playing...' : 'Test Sound'}
      </Button>
      <Button
        onClick={handleTestNotification}
        disabled={isLoading}
        variant="outline"
        size="sm"
      >
        <Bell className="h-4 w-4 mr-2" />
        {isLoading ? 'Sending...' : 'Test Notification'}
      </Button>
    </div>
  );
}