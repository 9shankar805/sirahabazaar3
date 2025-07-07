import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "./useAuth";
import type { CartItem, Product } from "@shared/schema";

interface CartItemWithProduct extends CartItem {
  product?: Product;
}

interface CartContextType {
  cartItems: CartItemWithProduct[];
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateCartItem: (cartItemId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalAmount: number;
  totalItems: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
  selectedItems: Set<number>;
  setSelectedItems: (items: Set<number>) => void;
  getSelectedCartItems: () => CartItemWithProduct[];
  getSelectedTotals: () => { amount: number; items: number };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const { user } = useAuth();

  const refreshCart = async () => {
    if (!user) {
      // Load guest cart from localStorage
      setIsLoading(true);
      try {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        if (guestCart.length > 0) {
          // Fetch product details for each cart item
          const itemsWithProducts = await Promise.all(
            guestCart.map(async (item: any) => {
              try {
                const productResponse = await fetch(`/api/products/${item.productId}`);
                if (productResponse.ok) {
                  const product = await productResponse.json();
                  return { ...item, product };
                }
                return item;
              } catch (error) {
                console.error(`Failed to fetch product ${item.productId}:`, error);
                return item;
              }
            })
          );
          setCartItems(itemsWithProducts);
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error("Failed to load guest cart:", error);
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart/${user.id}`);
      if (response.ok) {
        const items = await response.json();
        setCartItems(items);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const addToCart = async (productId: number, quantity: number) => {
    if (!user) {
      // For guest users, store in localStorage
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const existingItem = guestCart.find((item: any) => item.productId === productId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        guestCart.push({ 
          id: Date.now(),
          productId, 
          quantity, 
          userId: null,
          createdAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      
      // Fetch product details for guest cart
      const productResponse = await fetch(`/api/products/${productId}`);
      if (productResponse.ok) {
        const product = await productResponse.json();
        const updatedItems = guestCart.map((item: any) => ({
          ...item,
          product: item.productId === productId ? product : item.product
        }));
        setCartItems(updatedItems);
      }
      
      return;
    }

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        productId,
        quantity,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to add item to cart");
    }

    await refreshCart();
  };

  const updateCartItem = async (cartItemId: number, quantity: number) => {
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error("Failed to update cart item");
    }

    await refreshCart();
  };

  const removeFromCart = async (cartItemId: number) => {
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to remove item from cart");
    }

    await refreshCart();
  };

  const clearCart = async () => {
    if (!user) return;

    const response = await fetch(`/api/cart/user/${user.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to clear cart");
    }

    await refreshCart();
  };

  const totalAmount = cartItems.reduce((sum, item) => {
    if (item.product) {
      return sum + (Number(item.product.price) * item.quantity);
    }
    return sum;
  }, 0);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Helper functions for selected items
  const getSelectedCartItems = () => {
    return cartItems.filter(item => selectedItems.has(item.id));
  };

  const getSelectedTotals = () => {
    const selectedCartItems = getSelectedCartItems();
    const amount = selectedCartItems.reduce((sum, item) => {
      if (item.product) {
        return sum + (Number(item.product.price) * item.quantity);
      }
      return sum;
    }, 0);
    const items = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { amount, items };
  };

  // Auto-select all items when cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      totalAmount,
      totalItems,
      isLoading,
      refreshCart,
      deliveryFee,
      setDeliveryFee,
      selectedItems,
      setSelectedItems,
      getSelectedCartItems,
      getSelectedTotals,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
