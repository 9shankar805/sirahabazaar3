import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth";
import { CartProvider } from "./hooks/useCart";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/Navbar";
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
import ShopkeeperDashboard from "@/pages/ShopkeeperDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import AdminPanel from "@/pages/AdminPanel";
import StoreMaps from "@/pages/StoreMaps";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/stores/:id" component={StoreDetail} />
      <Route path="/shopkeeper-dashboard" component={ShopkeeperDashboard} />
      <Route path="/customer-dashboard" component={CustomerDashboard} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Router />
              </main>
              <Footer />
            </div>
            <Toaster />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
