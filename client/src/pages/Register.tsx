import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Store, User, Truck, Upload, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import AdminToggle from "@/components/AdminToggle";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["customer", "shopkeeper", "delivery_partner"]),
  address: z.string().optional(),
  
  // Comprehensive Delivery partner verification fields
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.string().optional(),
  vehicleColor: z.string().optional(),
  drivingLicense: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  deliveryAreas: z.array(z.string()).optional(),
  workingHours: z.string().optional(),
  experience: z.string().optional(),
  previousEmployment: z.string().optional(),
  references: z.string().optional(),
  medicalCertificate: z.string().optional(),
  policeClearance: z.string().optional(),
  idProofUrl: z.string().optional(),
  drivingLicenseUrl: z.string().optional(),
  vehicleRegistrationUrl: z.string().optional(),
  insuranceUrl: z.string().optional(),
  photoUrl: z.string().optional(),
  termsAccepted: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "delivery_partner") {
    return data.vehicleType && data.vehicleType.length > 0;
  }
  return true;
}, {
  message: "Vehicle type is required for delivery partners",
  path: ["vehicleType"],
}).refine((data) => {
  if (data.role === "delivery_partner") {
    return data.vehicleNumber && data.vehicleNumber.length > 0;
  }
  return true;
}, {
  message: "Vehicle number is required for delivery partners",
  path: ["vehicleNumber"],
}).refine((data) => {
  if (data.role === "delivery_partner") {
    return data.drivingLicense && data.drivingLicense.length > 0;
  }
  return true;
}, {
  message: "Driving license number is required for delivery partners",
  path: ["drivingLicense"],
}).refine((data) => {
  if (data.role === "delivery_partner") {
    return data.idProofType && data.idProofType.length > 0;
  }
  return true;
}, {
  message: "ID proof type is required for delivery partners",
  path: ["idProofType"],
}).refine((data) => {
  if (data.role === "delivery_partner") {
    return data.idProofNumber && data.idProofNumber.length > 0;
  }
  return true;
}, {
  message: "ID proof number is required for delivery partners",
  path: ["idProofNumber"],
}).refine((data) => {
  if (data.role === "delivery_partner") {
    return data.bankAccountNumber && data.bankAccountNumber.length > 0;
  }
  return true;
}, {
  message: "Bank account number is required for delivery partners",
  path: ["bankAccountNumber"],
}).refine((data) => {
  if (data.role === "delivery_partner") {
    return data.ifscCode && data.ifscCode.length > 0;
  }
  return true;
}, {
  message: "IFSC code is required for delivery partners",
  path: ["ifscCode"],
}).refine((data) => {
  if (data.role === "delivery_partner") {
    return data.emergencyContactName && data.emergencyContactName.length > 0;
  }
  return true;
}, {
  message: "Emergency contact name is required for delivery partners",
  path: ["emergencyContactName"],
}).refine((data) => {
  if (data.role === "delivery_partner") {
    return data.emergencyContactPhone && data.emergencyContactPhone.length > 0;
  }
  return true;
}, {
  message: "Emergency contact phone is required for delivery partners",
  path: ["emergencyContactPhone"],
}).refine((data) => {
  if (data.role === "delivery_partner") {
    return data.termsAccepted === true;
  }
  return true;
}, {
  message: "You must accept the terms and conditions",
  path: ["termsAccepted"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [, setLocation] = useLocation();
  const { register, user } = useAuth();
  const { toast } = useToast();
  
  // Check if current user is admin
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin') || localStorage.getItem('isAdmin') === 'true';

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "customer",
      address: "",
      vehicleType: "",
      vehicleNumber: "",
      vehicleBrand: "",
      vehicleModel: "",
      vehicleYear: "",
      vehicleColor: "",
      drivingLicense: "",
      licenseExpiryDate: "",
      idProofType: "",
      idProofNumber: "",
      bankAccountNumber: "",
      ifscCode: "",
      bankName: "",
      accountHolderName: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      deliveryAreas: [],
      workingHours: "",
      experience: "",
      previousEmployment: "",
      references: "",
      medicalCertificate: "",
      policeClearance: "",
      idProofUrl: "",
      drivingLicenseUrl: "",
      vehicleRegistrationUrl: "",
      insuranceUrl: "",
      photoUrl: "",
      termsAccepted: false,
    },
  });

  const selectedRole = form.watch("role");

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const { confirmPassword, termsAccepted, ...registerData } = data;
      
      // Set shopkeeper and delivery partner accounts as pending for admin approval
      const userData = {
        ...registerData,
        status: (registerData.role === 'shopkeeper' || registerData.role === 'delivery_partner') ? 'pending' : 'active'
      };
      
      let user;
      
      if (registerData.role === 'customer') {
        // For customers, use the auth hook to properly set user state
        await register(userData);
      } else {
        // For shopkeepers and delivery partners, use direct API call since they need approval
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Registration failed');
        }
        
        const result = await response.json();
        user = result.user || result;
      }
      
      if (registerData.role === 'delivery_partner' && user) {
        
        // Create delivery partner profile
        const deliveryPartnerData = {
          userId: user.id,
          vehicleType: data.vehicleType,
          vehicleNumber: data.vehicleNumber,
          deliveryArea: data.deliveryArea,
          idProofUrl: data.idProofUrl,
          drivingLicenseUrl: data.drivingLicenseUrl || '',
        };

        await fetch('/api/delivery-partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deliveryPartnerData),
        });

        toast({
          title: "Application submitted!",
          description: "Your delivery partner application is pending admin approval. You'll be notified once approved.",
        });
        setLocation("/login");
      } else if (registerData.role === 'shopkeeper') {
        toast({
          title: "Application submitted!",
          description: "Your shopkeeper account is pending admin approval. You'll be notified once approved.",
        });
        setLocation("/login");
      } else {
        toast({
          title: "Account created successfully!",
          description: "Welcome to Siraha Bazaar. You are now logged in.",
        });
        setLocation("/");
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to create account",
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Store className="h-8 w-8 text-primary mr-2" />
                <span className="text-2xl font-bold text-foreground">Siraha Bazaar</span>
              </div>
              <AdminToggle />
            </div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <p className="text-muted-foreground">
              Join our local marketplace community
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="customer">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              Customer - Shop from local stores
                            </div>
                          </SelectItem>
                          <SelectItem value="shopkeeper">
                            <div className="flex items-center">
                              <Store className="h-4 w-4 mr-2" />
                              Shopkeeper - Sell your products
                            </div>
                          </SelectItem>
                          <SelectItem value="delivery_partner">
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 mr-2" />
                              Delivery Partner - Deliver orders
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
                            placeholder="Create a password"
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
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

                {/* Address field for all roles */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Delivery Partner Specific Fields */}
                {selectedRole === "delivery_partner" && (
                  <div className="space-y-4 border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      Delivery Partner Information
                    </h3>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Note:</strong> Your application will be reviewed by our admin team. You'll receive a notification once approved.
                      </p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select vehicle type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="motorcycle">Motorcycle</SelectItem>
                              <SelectItem value="bicycle">Bicycle</SelectItem>
                              <SelectItem value="scooter">Scooter</SelectItem>
                              <SelectItem value="car">Car</SelectItem>
                              <SelectItem value="van">Van</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Number *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter vehicle number (e.g., BA 12 PA 1234)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Delivery Area *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter areas you want to deliver (e.g., Siraha, Lahan)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="idProofUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Proof Document *</FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                              <div className="text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4">
                                  <Input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        // For demo purposes, using a placeholder URL
                                        field.onChange(`/uploads/id_${Date.now()}.${file.name.split('.').pop()}`);
                                      }
                                    }}
                                    className="hidden"
                                    id="idProof"
                                  />
                                  <label
                                    htmlFor="idProof"
                                    className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
                                  >
                                    Upload Citizenship or License
                                  </label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG, PDF up to 10MB
                                  </p>
                                </div>
                              </div>
                              {field.value && (
                                <div className="mt-2 flex items-center text-sm text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Document uploaded
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="drivingLicenseUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Driving License (Optional)</FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                              <div className="text-center">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4">
                                  <Input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        field.onChange(`/uploads/license_${Date.now()}.${file.name.split('.').pop()}`);
                                      }
                                    }}
                                    className="hidden"
                                    id="drivingLicense"
                                  />
                                  <label
                                    htmlFor="drivingLicense"
                                    className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
                                  >
                                    Upload Driving License
                                  </label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG, PDF up to 10MB
                                  </p>
                                </div>
                              </div>
                              {field.value && (
                                <div className="mt-2 flex items-center text-sm text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  License uploaded
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              I agree to the delivery partner terms and conditions *
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              You agree to follow delivery guidelines and maintain professional conduct
                            </p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <div className="text-center">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
              

            </div>

            {selectedRole === "shopkeeper" && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Shopkeeper Benefits:</strong>
                  <br />• Create and manage your online store
                  <br />• Reach customers in your local area
                  <br />• Track orders and inventory
                  <br />• No setup fees - start selling immediately
                </p>
              </div>
            )}

            {selectedRole === "delivery_partner" && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Delivery Partner Benefits:</strong>
                  <br />• Flexible working hours - work when you want
                  <br />• Competitive delivery fees and bonuses
                  <br />• Weekly payments directly to your account
                  <br />• Support team available 24/7 for assistance
                  <br />• Get started immediately after approval
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        

      </div>
    </div>
  );
}
