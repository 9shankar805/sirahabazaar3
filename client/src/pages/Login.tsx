import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Store, User } from "lucide-react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, signInWithFacebook } from "@/lib/firebaseAuth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      
      setLocation("/");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      console.log('Starting Google login...');
      const result = await signInWithGoogle();
      const user = result.user;
      
      console.log('Google login successful, user:', {
        email: user.email,
        displayName: user.displayName,
        uid: user.uid
      });
      
      // Register user in our backend if they don't exist
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          fullName: user.displayName,
          provider: 'google',
          providerId: user.uid,
          photoUrl: user.photoURL
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('Backend registration successful:', userData);
        
        toast({
          title: "Welcome!",
          description: "Successfully logged in with Google.",
        });
        setLocation("/");
      } else {
        const errorData = await response.json();
        console.error('Backend registration failed:', errorData);
        throw new Error(errorData.error || 'Backend registration failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      
      let errorMessage = "Failed to login with Google";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific Firebase auth errors
        if (error.message.includes('auth/popup-closed-by-user')) {
          errorMessage = "Login was cancelled. Please try again.";
        } else if (error.message.includes('auth/popup-blocked')) {
          errorMessage = "Pop-up blocked. Please allow pop-ups and try again.";
        } else if (error.message.includes('auth/network-request-failed')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('auth/unauthorized-domain')) {
          errorMessage = "This domain is not authorized for Google login.";
        }
      }
      
      toast({
        title: "Google login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithFacebook();
      const user = result.user;
      
      // Register user in our backend if they don't exist
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          fullName: user.displayName,
          provider: 'facebook',
          providerId: user.uid,
          photoUrl: user.photoURL
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        toast({
          title: "Welcome!",
          description: "Successfully logged in with Facebook.",
        });
        setLocation("/");
      }
    } catch (error) {
      toast({
        title: "Facebook login failed",
        description: error instanceof Error ? error.message : "Failed to login with Facebook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold text-foreground">Siraha Bazaar</span>
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <p className="text-muted-foreground">
              Sign in to your account to continue shopping
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="remember" className="text-sm text-muted-foreground">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>

                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            {/* Social Login Options */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full"
                >
                  <FaGoogle className="h-4 w-4 mr-2 text-red-500" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                  className="w-full"
                >
                  <FaFacebook className="h-4 w-4 mr-2 text-blue-600" />
                  Facebook
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-center">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Create Account
                </Link>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 border-t pt-6">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-3">Demo Accounts:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2 p-2 bg-muted rounded">
                    <User className="h-4 w-4" />
                    <span>Customer: customer@example.com</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 p-2 bg-muted rounded">
                    <Store className="h-4 w-4" />
                    <span>Shopkeeper: shopkeeper@example.com</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Password: password123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
