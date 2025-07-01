import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";

type AppMode = 'shopping' | 'food';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('shopping');
  const [, setLocation] = useLocation();

  // Enhanced setMode function with automatic navigation
  const handleSetMode = (newMode: AppMode) => {
    const currentMode = mode;
    setMode(newMode);
    
    // Auto-navigate to homepage when switching modes
    if (currentMode !== newMode) {
      if (newMode === 'food') {
        // Always go to homepage when switching to food mode
        setLocation('/');
      } else if (newMode === 'shopping') {
        // Always go to homepage when switching to shopping mode
        setLocation('/');
      }
    }
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode: handleSetMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}