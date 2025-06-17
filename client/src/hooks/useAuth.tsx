import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserData = async (userId: number) => {
    try {
      const response = await fetch(`/api/auth/refresh?userId=${userId}`);
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.user) {
          setUser(responseData.user);
          localStorage.setItem("user", JSON.stringify(responseData.user));
        } else {
          console.warn("No user data in refresh response");
        }
      } else {
        console.warn("Failed to refresh user data:", response.status);
        // Don't clear user on failed refresh, just log the warning
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // Don't clear user on network errors, just log the error
    }
  };

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // If user is a shopkeeper with pending status, check for updates periodically
        if (userData.role === 'shopkeeper' && userData.status !== 'active') {
          const interval = setInterval(async () => {
            try {
              await refreshUserData(userData.id);
            } catch (error) {
              // Silently fail to avoid disrupting user experience
            }
          }, 30000); // Check every 30 seconds
          
          return () => clearInterval(interval);
        }
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const { user } = await response.json();
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    
    // Redirect delivery partners directly to their dashboard
    if (user.role === 'delivery_partner') {
      window.location.href = '/delivery-partner/dashboard';
    }
  };

  const register = async (userData: any) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    const { user } = await response.json();
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const refreshUser = async () => {
    if (user?.id) {
      await refreshUserData(user.id);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Redirect to home page after logout
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
