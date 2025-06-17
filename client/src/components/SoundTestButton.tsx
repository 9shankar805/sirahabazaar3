
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SoundTestButton() {
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const testNotificationSound = async () => {
    setIsTesting(true);
    
    try {
      // Test the notification.mp3 file
      console.log('Testing notification sound...');
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.8;
      
      // Add event listeners for debugging
      audio.addEventListener('canplaythrough', () => {
        console.log('Audio can play through');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
      });
      
      audio.addEventListener('loadstart', () => {
        console.log('Audio loading started');
      });
      
      audio.addEventListener('loadeddata', () => {
        console.log('Audio data loaded');
      });
      
      await audio.play();
      
      toast({
        title: "🔊 Sound Test Successful!",
        description: "Notification sound is working properly.",
      });
      
      console.log('Sound played successfully');
      
    } catch (error) {
      console.error('Sound test failed:', error);
      
      // Try fallback beep sound
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
        
        toast({
          title: "⚠️ Fallback Sound",
          description: "notification.mp3 failed, but audio system works. Check file exists.",
          variant: "destructive"
        });
        
      } catch (fallbackError) {
        toast({
          title: "❌ Sound Test Failed",
          description: "Audio system not available or blocked by browser.",
          variant: "destructive"
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button
      onClick={testNotificationSound}
      disabled={isTesting}
      variant="outline"
      size="sm"
      className="fixed bottom-32 right-4 z-40 bg-green-500 text-white hover:bg-green-600"
    >
      {isTesting ? (
        <VolumeX className="h-4 w-4 mr-2" />
      ) : (
        <Volume2 className="h-4 w-4 mr-2" />
      )}
      {isTesting ? 'Testing...' : '🔊 Test Sound'}
    </Button>
  );
}
