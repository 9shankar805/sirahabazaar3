import { useState } from "react";
import { ShoppingBag, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";

interface ModeSwiperProps {
  currentMode: 'shopping' | 'food';
  onModeChange: (mode: 'shopping' | 'food') => void;
}

export default function ModeSwiper({ currentMode, onModeChange }: ModeSwiperProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSwipe = (newMode: 'shopping' | 'food') => {
    if (newMode === currentMode || isAnimating) return;
    
    setIsAnimating(true);
    onModeChange(newMode);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="relative bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Background slider */}
        <motion.div
          className="absolute top-1 bottom-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
          animate={{
            left: currentMode === 'shopping' ? '4px' : '50%',
            width: '50%'
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        
        {/* Shopping Button */}
        <button
          onClick={() => handleSwipe('shopping')}
          className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
            currentMode === 'shopping' 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-300 hover:text-orange-500'
          }`}
          disabled={isAnimating}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="font-medium">Shopping</span>
        </button>
        
        {/* Food Delivery Button */}
        <button
          onClick={() => handleSwipe('food')}
          className={`relative z-10 flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
            currentMode === 'food' 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
          }`}
          disabled={isAnimating}
        >
          <UtensilsCrossed className="h-5 w-5" />
          <span className="font-medium">Food</span>
        </button>
      </div>
      
      {/* Mode indicator text */}
      <div className="text-center mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {currentMode === 'shopping' ? 'Shop Products' : 'Order Food'}
        </span>
      </div>
    </div>
  );
}