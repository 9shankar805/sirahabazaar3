// Sound effects management for Siraha Bazaar
// Provides audio feedback for user interactions and notifications

interface SoundConfig {
  volume: number;
  enabled: boolean;
}

class SoundManager {
  private config: SoundConfig = {
    volume: 0.5,
    enabled: true
  };

  private sounds: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    this.loadSettings();
    this.preloadSounds();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('siraha-sound-settings');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.log('Using default sound settings');
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('siraha-sound-settings', JSON.stringify(this.config));
    } catch (error) {
      console.log('Failed to save sound settings');
    }
  }

  private preloadSounds() {
    const soundFiles = {
      // Cart actions
      'cart-add': this.createBeepSound(800, 100), // High beep for add to cart
      'cart-remove': this.createBeepSound(400, 150), // Lower beep for remove
      'cart-clear': this.createBeepSound(300, 200), // Deep beep for clear cart
      
      // Order actions
      'order-placed': this.createSuccessSound(), // Success melody
      'order-confirmed': this.createBeepSound(600, 100, 2), // Double beep
      'order-ready': this.createNotificationSound(), // Notification tone
      
      // Notifications
      'notification': this.createNotificationSound(), // Default notification
      'message': this.createBeepSound(700, 80), // Message received
      'alert': this.createAlertSound(), // Alert/warning sound
      'success': this.createSuccessSound(), // Success action
      'error': this.createErrorSound(), // Error/failure sound
      
      // UI interactions
      'button-click': this.createBeepSound(500, 50), // Button press
      'toggle': this.createBeepSound(600, 40), // Toggle switch
      'tab-switch': this.createBeepSound(450, 60), // Tab navigation
      'modal-open': this.createBeepSound(650, 80), // Modal/dialog open
      'modal-close': this.createBeepSound(350, 80), // Modal/dialog close
      
      // E-commerce specific
      'product-like': this.createBeepSound(750, 70), // Product liked/favorited
      'review-submit': this.createSuccessSound(), // Review submitted
      'payment-success': this.createPaymentSuccessSound(), // Payment completed
      'delivery-update': this.createNotificationSound(), // Delivery status update
    };

    this.sounds = soundFiles;
  }

  // Create different types of sounds programmatically
  private createBeepSound(frequency: number, duration: number, count: number = 1): HTMLAudioElement {
    const audio = new Audio();
    
    // Create a simple beep using Web Audio API data URL
    const sampleRate = 8000;
    const samples = Math.floor(sampleRate * duration / 1000);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate beep samples
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
      view.setInt16(44 + i * 2, sample * 32767, true);
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    audio.src = URL.createObjectURL(blob);
    audio.preload = 'auto';
    
    return audio;
  }

  private createNotificationSound(): HTMLAudioElement {
    // Create a pleasant notification sound (rising tone)
    return this.createMultiToneSound([523, 659, 784], [100, 100, 200]);
  }

  private createSuccessSound(): HTMLAudioElement {
    // Create a success melody (C-E-G chord progression)
    return this.createMultiToneSound([523, 659, 784, 1047], [150, 150, 150, 300]);
  }

  private createErrorSound(): HTMLAudioElement {
    // Create an error sound (descending tone)
    return this.createMultiToneSound([400, 350, 300], [200, 200, 300]);
  }

  private createAlertSound(): HTMLAudioElement {
    // Create an alert sound (oscillating)
    return this.createMultiToneSound([800, 600, 800, 600], [100, 100, 100, 100]);
  }

  private createPaymentSuccessSound(): HTMLAudioElement {
    // Create a celebration sound for successful payments
    return this.createMultiToneSound([523, 659, 784, 1047, 1319], [120, 120, 120, 120, 400]);
  }

  private createMultiToneSound(frequencies: number[], durations: number[]): HTMLAudioElement {
    const audio = new Audio();
    const sampleRate = 8000;
    const totalDuration = durations.reduce((sum, dur) => sum + dur, 0);
    const totalSamples = Math.floor(sampleRate * totalDuration / 1000);
    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);
    
    // WAV header (same as createBeepSound)
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, totalSamples * 2, true);
    
    // Generate multi-tone samples
    let sampleOffset = 0;
    frequencies.forEach((freq, index) => {
      const duration = durations[index];
      const samples = Math.floor(sampleRate * duration / 1000);
      
      for (let i = 0; i < samples; i++) {
        const sample = Math.sin(2 * Math.PI * freq * i / sampleRate) * 0.3;
        view.setInt16(44 + (sampleOffset + i) * 2, sample * 32767, true);
      }
      
      sampleOffset += samples;
    });
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    audio.src = URL.createObjectURL(blob);
    audio.preload = 'auto';
    
    return audio;
  }

  // Public methods
  play(soundName: string, options?: { force?: boolean }) {
    if (!this.config.enabled && !options?.force) return;
    
    const sound = this.sounds[soundName];
    if (!sound) {
      console.log(`Sound '${soundName}' not found`);
      return;
    }

    try {
      sound.volume = this.config.volume;
      sound.currentTime = 0; // Reset to beginning
      sound.play().catch(error => {
        // Ignore play errors (usually due to user interaction policy)
        console.log(`Could not play sound '${soundName}':`, error.message);
      });
    } catch (error) {
      console.log(`Error playing sound '${soundName}':`, error);
    }
  }

  // Configuration methods
  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  getVolume(): number {
    return this.config.volume;
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    this.saveSettings();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  // Test method
  test(soundName?: string) {
    if (soundName) {
      this.play(soundName, { force: true });
    } else {
      // Play all sounds for testing
      Object.keys(this.sounds).forEach((name, index) => {
        setTimeout(() => this.play(name, { force: true }), index * 300);
      });
    }
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

// Convenience functions for common actions
export const playSound = {
  cartAdd: () => soundManager.play('cart-add'),
  cartRemove: () => soundManager.play('cart-remove'),
  cartClear: () => soundManager.play('cart-clear'),
  orderPlaced: () => soundManager.play('order-placed'),
  orderConfirmed: () => soundManager.play('order-confirmed'),
  orderReady: () => soundManager.play('order-ready'),
  notification: () => soundManager.play('notification'),
  message: () => soundManager.play('message'),
  alert: () => soundManager.play('alert'),
  success: () => soundManager.play('success'),
  error: () => soundManager.play('error'),
  buttonClick: () => soundManager.play('button-click'),
  toggle: () => soundManager.play('toggle'),
  tabSwitch: () => soundManager.play('tab-switch'),
  modalOpen: () => soundManager.play('modal-open'),
  modalClose: () => soundManager.play('modal-close'),
  productLike: () => soundManager.play('product-like'),
  reviewSubmit: () => soundManager.play('review-submit'),
  paymentSuccess: () => soundManager.play('payment-success'),
  deliveryUpdate: () => soundManager.play('delivery-update'),
};

export default soundManager;