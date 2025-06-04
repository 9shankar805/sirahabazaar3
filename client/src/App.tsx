import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth";
import { CartProvider } from "./hooks/useCart";
import { WishlistProvider } from "./hooks/useWishlist";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/Navbar";
import BottomNavbar from "@/components/BottomNavbar";
import Footer from "@/components/Footer";
import Homepage from "@/pages/Homepage";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import StoreDetail from "@/pages/StoreDetail";
import Stores from "@/pages/Stores";
import Account from "@/pages/Account";
import ShopkeeperDashboard from "@/pages/ShopkeeperDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import AdminPanel from "@/pages/AdminPanel";
import StoreMaps from "@/pages/StoreMaps";
import Wishlist from "@/pages/Wishlist";
import Categories from "@/pages/Categories";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/categories" component={Categories} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/stores" component={Stores} />
      <Route path="/stores/:id" component={StoreDetail} />
      <Route path="/account" component={Account} />
      <Route path="/shopkeeper-dashboard" component={ShopkeeperDashboard} />
      <Route path="/customer-dashboard" component={CustomerDashboard} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/store-maps" component={StoreMaps} />
      <Route path="/wishlist" component={Wishlist} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <TooltipProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1 pb-16 md:pb-0">
                  <Router />
                </main>
                <Footer />
                <BottomNavbar />
              </div>
              <Toaster />
            </TooltipProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
