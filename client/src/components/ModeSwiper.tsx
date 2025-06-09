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
    <div className="fixed top-4 right-4 z-50">
      <div className="relative bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Background slider */}
        <motion.div
          className="absolute top-1 bottom-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
          animate={{
            left: currentMode === 'shopping' ? '4px' : 'calc(50% - 2px)',
            width: 'calc(50% - 2px)'
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        
        {/* Shopping Button */}
        <button
          onClick={() => handleSwipe('shopping')}
          className={`relative z-10 p-3 rounded-full transition-all duration-200 ${
            currentMode === 'shopping' 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-300 hover:text-orange-500'
          }`}
          disabled={isAnimating}
          title="Shopping Mode"
        >
          <ShoppingBag className="h-5 w-5" />
        </button>
        
        {/* Food Delivery Button */}
        <button
          onClick={() => handleSwipe('food')}
          className={`relative z-10 p-3 rounded-full transition-all duration-200 ${
            currentMode === 'food' 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
          }`}
          disabled={isAnimating}
          title="Food Delivery Mode"
        >
          <UtensilsCrossed className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}