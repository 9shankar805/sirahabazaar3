import { pgTable, text, serial, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  role: text("role").notNull().default("customer"), // customer, shopkeeper
  status: text("status").notNull().default("active"), // active, pending, suspended, rejected
  approvalDate: timestamp("approval_date"),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("admin"), // admin, super_admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  phone: text("phone"),
  website: text("website"),
  logo: text("logo"), // Store logo URL
  coverImage: text("cover_image"), // Store cover image URL
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0),
  featured: boolean("featured").default(false),
  isActive: boolean("is_active").default(true),
  storeType: text("store_type").notNull().default("retail"), // retail, restaurant
  cuisineType: text("cuisine_type"), // For restaurants: indian, chinese, fast-food, etc.
  deliveryTime: text("delivery_time"), // For restaurants: "25-35 mins"
  minimumOrder: decimal("minimum_order", { precision: 10, scale: 2 }), // For restaurants
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }), // For restaurants
  isDeliveryAvailable: boolean("is_delivery_available").default(false),
  openingHours: text("opening_hours"), // JSON string for business hours
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  categoryId: integer("category_id").references(() => categories.id),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  stock: integer("stock").default(0),
  images: text("images").array().default([]),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0),
  isActive: boolean("is_active").default(true),
  isFastSell: boolean("is_fast_sell").default(false), // Fast sell product
  isOnOffer: boolean("is_on_offer").default(false), // Special offer
  offerPercentage: integer("offer_percentage").default(0), // Discount percentage
  offerEndDate: text("offer_end_date"), // When offer expires (stored as string)
  productType: text("product_type").notNull().default("retail"), // retail, food
  preparationTime: text("preparation_time"), // For food items: "15-20 mins"
  ingredients: text("ingredients").array().default([]), // For food items
  allergens: text("allergens").array().default([]), // For food items
  spiceLevel: text("spice_level"), // For food items: mild, medium, hot
  isVegetarian: boolean("is_vegetarian").default(false),
  isVegan: boolean("is_vegan").default(false),
  nutritionInfo: text("nutrition_info"), // JSON string for calories, protein, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  shippingAddress: text("shipping_address").notNull(),
  paymentMethod: text("payment_method").notNull(),
  phone: text("phone").notNull(),
  customerName: text("customer_name").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }), // Customer location latitude
  longitude: decimal("longitude", { precision: 11, scale: 8 }), // Customer location longitude
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin table for tracking and management
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Website analytics and tracking
export const websiteVisits = pgTable("website_visits", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  page: text("page").notNull(),
  referrer: text("referrer"),
  sessionId: text("session_id"),
  userId: integer("user_id").references(() => users.id),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
});

// Notifications system
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, success, warning, error
  isRead: boolean("is_read").default(false),
  orderId: integer("order_id").references(() => orders.id),
  productId: integer("product_id").references(() => products.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order tracking system
export const orderTracking = pgTable("order_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  status: text("status").notNull(),
  description: text("description"),
  location: text("location"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Return policy and returns
export const returnPolicies = pgTable("return_policies", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  returnDays: integer("return_days").default(7),
  returnConditions: text("return_conditions"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  orderItemId: integer("order_item_id").references(() => orderItems.id).notNull(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").notNull().default("requested"), // requested, approved, rejected, completed
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  images: text("images").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Seller promotions and advertisements
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // percentage, fixed_amount
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Store advertisements/banners
export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  targetUrl: text("target_url"),
  position: text("position").notNull(), // homepage_banner, category_sidebar, product_listing
  priority: integer("priority").default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  costPerClick: decimal("cost_per_click", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product reviews and ratings
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  comment: text("comment"),
  images: text("images").array().default([]),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  isApproved: boolean("is_approved").default(true),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Store settlements and payouts
export const settlements = pgTable("settlements", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  paymentGatewayFee: decimal("payment_gateway_fee", { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  settlementDate: timestamp("settlement_date"),
  bankAccount: text("bank_account"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Store analytics tracking
export const storeAnalytics = pgTable("store_analytics", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  pageViews: integer("page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  productViews: integer("product_views").default(0),
  addToCartCount: integer("add_to_cart_count").default(0),
  checkoutCount: integer("checkout_count").default(0),
  ordersCount: integer("orders_count").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0.00"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0.00"),
});

// Inventory management
export const inventoryLogs = pgTable("inventory_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  type: text("type").notNull(), // stock_in, stock_out, adjustment, return
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  reason: text("reason"),
  orderId: integer("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalReviews: true,
}).extend({
  minimumOrder: z.union([z.string(), z.number()]).optional().transform((val) => 
    val !== undefined && val !== null && val !== "" ? String(val) : undefined
  ),
  deliveryFee: z.union([z.string(), z.number()]).optional().transform((val) => 
    val !== undefined && val !== null && val !== "" ? String(val) : undefined
  ),
  latitude: z.union([z.string(), z.number()]).optional().transform((val) => 
    val !== undefined && val !== null && val !== "" ? String(val) : undefined
  ),
  longitude: z.union([z.string(), z.number()]).optional().transform((val) => 
    val !== undefined && val !== null && val !== "" ? String(val) : undefined
  ),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalReviews: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
}).extend({
  latitude: z.union([z.string(), z.number()]).optional().transform((val) => 
    val !== undefined ? String(val) : undefined
  ),
  longitude: z.union([z.string(), z.number()]).optional().transform((val) => 
    val !== undefined ? String(val) : undefined
  ),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
  createdAt: true,
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertWebsiteVisitSchema = createInsertSchema(websiteVisits).omit({
  id: true,
  visitedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertOrderTrackingSchema = createInsertSchema(orderTracking).omit({
  id: true,
  updatedAt: true,
});

export const insertReturnPolicySchema = createInsertSchema(returnPolicies).omit({
  id: true,
  createdAt: true,
});

export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  createdAt: true,
  usedCount: true,
});

export const insertAdvertisementSchema = createInsertSchema(advertisements).omit({
  id: true,
  createdAt: true,
  impressions: true,
  clicks: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
  helpfulCount: true,
});

export const insertSettlementSchema = createInsertSchema(settlements).omit({
  id: true,
  createdAt: true,
});

export const insertStoreAnalyticsSchema = createInsertSchema(storeAnalytics).omit({
  id: true,
});

export const insertInventoryLogSchema = createInsertSchema(inventoryLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type WebsiteVisit = typeof websiteVisits.$inferSelect;
export type InsertWebsiteVisit = z.infer<typeof insertWebsiteVisitSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type OrderTracking = typeof orderTracking.$inferSelect;
export type InsertOrderTracking = z.infer<typeof insertOrderTrackingSchema>;
export type ReturnPolicy = typeof returnPolicies.$inferSelect;
export type InsertReturnPolicy = z.infer<typeof insertReturnPolicySchema>;
export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type Settlement = typeof settlements.$inferSelect;
export type InsertSettlement = z.infer<typeof insertSettlementSchema>;
export type StoreAnalytics = typeof storeAnalytics.$inferSelect;
export type InsertStoreAnalytics = z.infer<typeof insertStoreAnalyticsSchema>;
export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;

// Admin user schema
export const insertAdminUserSchema = createInsertSchema(adminUsers);
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
