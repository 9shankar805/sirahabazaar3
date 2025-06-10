import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { NotificationService } from "./notificationService";

import { 
  insertUserSchema, insertStoreSchema, insertProductSchema, insertOrderSchema, insertCartItemSchema,
  insertWishlistItemSchema, insertAdminSchema, insertWebsiteVisitSchema, insertNotificationSchema, 
  insertOrderTrackingSchema, insertReturnPolicySchema, insertReturnSchema, insertCategorySchema,
  insertPromotionSchema, insertAdvertisementSchema, insertProductReviewSchema, insertSettlementSchema,
  insertStoreAnalyticsSchema, insertInventoryLogSchema, insertCouponSchema, insertBannerSchema,
  insertSupportTicketSchema, insertSiteSettingSchema, insertFraudAlertSchema, insertCommissionSchema,
  insertProductAttributeSchema, insertVendorVerificationSchema, insertAdminLogSchema,
  insertDeliveryPartnerSchema, insertDeliverySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to track website visits
  app.use(async (req, res, next) => {
    try {
      const visitData = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        page: req.path,
        referrer: req.get('Referrer'),
        sessionId: (req as any).sessionID || 'anonymous',
        userId: req.body?.userId || null
      };
      
      await storage.recordVisit(visitData);
    } catch (error) {
      // Continue even if visit tracking fails
    }
    next();
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Generate username from email if not provided
      const userData = {
        ...req.body,
        username: req.body.username || req.body.email.split('@')[0]
      };
      
      // Validate role and set appropriate status
      const validRoles = ['customer', 'shopkeeper', 'delivery_partner'];
      if (userData.role && !validRoles.includes(userData.role)) {
        return res.status(400).json({ error: "Invalid role specified" });
      }
      
      // Set default role if not provided
      if (!userData.role) {
        userData.role = 'customer';
      }
      
      // Set status based on role - customers are active by default, others need approval
      if (userData.role === 'customer') {
        userData.status = 'active';
      } else {
        userData.status = 'pending'; // shopkeepers and delivery_partners need approval
      }
      
      const validatedData = insertUserSchema.parse(userData);
      
      // Check if user already exists by email or phone
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      
      // Check for phone number duplication if provided
      if (validatedData.phone) {
        const existingPhone = await storage.getUserByPhone(validatedData.phone);
        if (existingPhone) {
          return res.status(400).json({ error: "User already exists with this phone number" });
        }
      }
      
      const user = await storage.createUser(validatedData);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/refresh", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      
      const user = await storage.getUser(parseInt(userId as string));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh user data" });
    }
  });

  // Search suggestions route
  app.get("/api/search/suggestions", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json({ products: [], stores: [] });
      }

      const query = q.toLowerCase();
      
      // Get products and stores that match the query
      const [allProducts, allStores] = await Promise.all([
        storage.getAllProducts(),
        storage.getAllStores()
      ]);

      const products = allProducts
        .filter(product => 
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
        )
        .slice(0, 5); // Limit to 5 suggestions

      const stores = allStores
        .filter(store => 
          store.name.toLowerCase().includes(query) ||
          store.description?.toLowerCase().includes(query)
        )
        .slice(0, 5); // Limit to 5 suggestions

      res.json({ products, stores });
    } catch (error) {
      console.error("Search suggestions error:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // Store routes
  app.get("/api/stores", async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      console.error("Store fetch error:", error);
      res.status(500).json({ error: "Failed to fetch stores" });
    }
  });

  // Get stores by owner
  app.get("/api/stores/owner", async (req, res) => {
    try {
      const { ownerId, userId } = req.query;
      const id = ownerId || userId;
      
      if (!id) {
        return res.status(400).json({ error: "Owner ID or User ID is required" });
      }
      
      const parsedId = parseInt(id as string);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: "Invalid owner ID" });
      }
      
      const stores = await storage.getStoresByOwnerId(parsedId);
      res.json(stores);
    } catch (error) {
      console.error("Error fetching stores by owner:", error);
      res.status(500).json({ 
        error: "Failed to fetch store",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/stores/owner/:ownerId", async (req, res) => {
    try {
      const ownerId = parseInt(req.params.ownerId);
      const stores = await storage.getStoresByOwnerId(ownerId);
      res.json(stores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stores for owner" });
    }
  });

  // Add route for stores/owner without parameter (used by frontend)
  app.get("/api/stores/owner", async (req, res) => {
    try {
      const { userId, ownerId } = req.query;
      
      if (!userId && !ownerId) {
        return res.status(400).json({ error: "Owner ID or User ID is required" });
      }
      
      const id = parseInt((userId || ownerId) as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const stores = await storage.getStoresByOwnerId(id);
      res.json(stores);
    } catch (error) {
      console.error("Stores/owner error:", error);
      res.status(500).json({ error: "Failed to fetch stores for owner" });
    }
  });



  app.post("/api/stores", async (req, res) => {
    try {
      // Auto-generate slug if not provided
      if (!req.body.slug && req.body.name) {
        req.body.slug = req.body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') + '-' + Date.now();
      }
      
      const storeData = insertStoreSchema.parse(req.body);
      
      // Check if user already has a store
      const existingStores = await storage.getStoresByOwnerId(storeData.ownerId);
      if (existingStores.length > 0) {
        return res.status(400).json({ 
          error: "You can only create one store per account" 
        });
      }
      
      // Check if store name already exists
      const allStores = await storage.getAllStores();
      const nameExists = allStores.some(store => 
        store.name.toLowerCase() === storeData.name.toLowerCase()
      );
      if (nameExists) {
        return res.status(400).json({ 
          error: "A store with this name already exists" 
        });
      }
      
      const store = await storage.createStore(storeData);
      res.json(store);
    } catch (error) {
      console.error("Store creation error:", error);
      res.status(400).json({ 
        error: "Invalid store data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { search, category, storeId } = req.query;
      
      let products;
      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (category) {
        products = await storage.getProductsByCategory(parseInt(category as string));
      } else if (storeId) {
        products = await storage.getProductsByStoreId(parseInt(storeId as string));
      } else {
        products = await storage.getAllProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      
      // Auto-generate slug if not provided
      if (!productData.slug && productData.name) {
        productData.slug = productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') + '-' + Date.now();
      }
      
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(400).json({ 
        error: "Invalid product data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Fixed products by store endpoint for inventory (must come before parameterized route)
  app.get("/api/products/store", async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const userIdNum = parseInt(userId as string);
      if (isNaN(userIdNum)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      console.log(`Fetching stores for user ${userIdNum}`);
      
      // Get user's stores first with error handling
      let userStores = [];
      try {
        userStores = await storage.getStoresByOwnerId(userIdNum);
        console.log(`Found ${userStores.length} stores for user ${userIdNum}`);
      } catch (storeError) {
        console.error(`Error fetching stores for user ${userIdNum}:`, storeError);
        return res.status(500).json({ error: "Failed to fetch user stores" });
      }
      
      if (userStores.length === 0) {
        console.log(`No stores found for user ${userIdNum}, returning empty array`);
        return res.json([]);
      }
      
      // Get products for all user's stores
      const allProducts = [];
      for (const store of userStores) {
        console.log(`Fetching products for store ${store.id} (${store.name})`);
        try {
          const storeProducts = await storage.getProductsByStoreId(store.id);
          console.log(`Found ${storeProducts.length} products for store ${store.id}`);
          
          // Add store information to each product for better debugging
          const productsWithStore = storeProducts.map(product => ({
            ...product,
            storeName: store.name,
            storeType: store.storeType
          }));
          
          allProducts.push(...productsWithStore);
        } catch (storeError) {
          console.error(`Error fetching products for store ${store.id}:`, storeError);
          // Continue with other stores instead of failing completely
        }
      }
      
      console.log(`Total products found: ${allProducts.length}`);
      res.json(allProducts);
    } catch (error) {
      console.error("Products/store error details:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get products by store ID (parameterized route comes after query-based route)
  app.get("/api/products/store/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      if (isNaN(storeId)) {
        return res.status(400).json({ error: "Invalid store ID" });
      }
      
      const products = await storage.getProductsByStoreId(storeId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching store products:", error);
      res.status(500).json({ error: "Failed to fetch products by store ID" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Category creation error:", error);
      res.status(400).json({ 
        error: "Invalid category data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const category = await storage.updateCategory(id, updates);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Cart routes
  app.get("/api/cart/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const cartItems = await storage.getCartItems(userId);
      
      // Get product details for each cart item
      const cartWithProducts = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        })
      );
      
      res.json(cartWithProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const cartItemData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ error: "Invalid cart item data" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(id, quantity);
      
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.removeFromCart(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove cart item" });
    }
  });

  app.delete("/api/cart/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const cleared = await storage.clearCart(userId);
      
      if (!cleared) {
        return res.status(404).json({ error: "Failed to clear cart" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Wishlist routes
  app.get("/api/wishlist/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const wishlistItems = await storage.getWishlistItems(userId);
      res.json(wishlistItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist items" });
    }
  });

  app.post("/api/wishlist", async (req, res) => {
    try {
      const validatedData = insertWishlistItemSchema.parse(req.body);
      const wishlistItem = await storage.addToWishlist(validatedData);
      res.status(201).json(wishlistItem);
    } catch (error) {
      res.status(400).json({ error: "Invalid wishlist item data" });
    }
  });

  app.delete("/api/wishlist/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.removeFromWishlist(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Wishlist item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove wishlist item" });
    }
  });

  app.get("/api/wishlist/:userId/check/:productId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const productId = parseInt(req.params.productId);
      const isInWishlist = await storage.isInWishlist(userId, productId);
      res.json({ isInWishlist });
    } catch (error) {
      res.status(500).json({ error: "Failed to check wishlist status" });
    }
  });

  // Order routes
  app.get("/api/orders/customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const orders = await storage.getOrdersByCustomerId(customerId);
      
      // Get order items with product details for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          
          // Get product details for each item
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProduct(item.productId);
              return { ...item, product };
            })
          );
          
          return { ...order, items: itemsWithProducts };
        })
      );
      
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get orders for store owner (for shopkeeper dashboard)
  app.get("/api/orders/store", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Get the user's stores first
      const stores = await storage.getStoresByOwnerId(parseInt(userId as string));
      if (stores.length === 0) {
        return res.json([]);
      }
      
      // Get orders for all stores owned by this user
      const allOrders = [];
      for (const store of stores) {
        const orders = await storage.getOrdersByStoreId(store.id);
        // Get order items with product details for each order
        for (const order of orders) {
          const items = await storage.getOrderItems(order.id);
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProduct(item.productId);
              return { ...item, product };
            })
          );
          allOrders.push({ ...order, items: itemsWithProducts });
        }
      }
      
      res.json(allOrders);
    } catch (error) {
      console.error("Error fetching store orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/store/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const orders = await storage.getOrdersByStoreId(storeId);
      
      // Get order items with product details for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProduct(item.productId);
              return { ...item, product };
            })
          );
          return { ...order, items: itemsWithProducts };
        })
      );
      
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { order, items } = req.body;
      console.log("Order request:", { order, items });
      
      // Create order with location data
      const orderData = insertOrderSchema.parse(order);
      const createdOrder = await storage.createOrder(orderData);
      
      // Create order items and collect store owners for notifications
      const storeOwners = new Set<number>();
      const orderItems = await Promise.all(
        items.map(async (item: any) => {
          const orderItem = await storage.createOrderItem({
            ...item,
            orderId: createdOrder.id
          });
          
          // Get store info for notifications
          const store = await storage.getStore(item.storeId);
          if (store) {
            storeOwners.add(store.ownerId);
          }
          
          return orderItem;
        })
      );
      
      // Create order tracking
      await storage.createOrderTracking({
        orderId: createdOrder.id,
        status: "pending",
        description: "Order placed successfully"
      });
      
      // Send notifications using the notification service
      await NotificationService.sendOrderNotificationToShopkeepers(
        createdOrder.id,
        orderData.customerName,
        orderData.totalAmount,
        orderItems
      );
      
      // Send payment confirmation to customer
      await NotificationService.sendPaymentConfirmation(
        orderData.customerId,
        createdOrder.id,
        orderData.totalAmount,
        orderData.paymentMethod
      );
      
      // Send order confirmation to customer
      await storage.createNotification({
        userId: orderData.customerId,
        title: "Order Confirmed",
        message: `Your order #${createdOrder.id} has been confirmed and is being processed`,
        type: "order",
        orderId: createdOrder.id,
        isRead: false
      });
      
      // Clear user's cart
      await storage.clearCart(order.customerId);
      
      res.json({ order: createdOrder, items: orderItems });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(400).json({ error: "Failed to create order" });
    }
  });

  // Get individual order details
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Get order items with product details
      const items = await storage.getOrderItems(orderId);
      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        })
      );
      
      res.json({ ...order, items: itemsWithProducts });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, description, location } = req.body;
      
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Create tracking entry for the status update
      await storage.updateOrderTracking(id, status, description, location);
      
      // Send notification to customer
      await NotificationService.sendOrderStatusUpdateToCustomer(
        order.customerId,
        order.id,
        status,
        description
      );
      
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: "Failed to update order status" });
    }
  });

  // User profile routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ error: "Failed to update user" });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const admin = await storage.authenticateAdmin(email, password);
      
      if (!admin) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }
      
      res.json({ admin });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Admin login failed" });
    }
  });

  // Admin user management routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsersWithStatus();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/pending", async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending users" });
    }
  });

  app.post("/api/admin/users/:userId/approve", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { adminId } = req.body;
      
      if (!adminId) {
        return res.status(400).json({ error: "Admin ID is required" });
      }
      
      const approvedUser = await storage.approveUser(userId, adminId);
      
      if (!approvedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Send notification to approved user
      await storage.createNotification({
        userId: userId,
        title: "Account Approved",
        message: "Your shopkeeper account has been approved! You can now start creating your store and adding products.",
        type: "success"
      });
      
      res.json(approvedUser);
    } catch (error) {
      console.error("Error in approve user route:", error);
      res.status(500).json({ error: "Failed to approve user", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/users/:userId/reject", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { adminId, reason } = req.body;
      
      if (!adminId) {
        return res.status(400).json({ error: "Admin ID is required" });
      }
      
      const rejectedUser = await storage.rejectUser(userId, adminId);
      
      if (!rejectedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Send notification to rejected user
      const message = reason 
        ? `Your shopkeeper account application has been rejected. Reason: ${reason}`
        : "Your shopkeeper account application has been rejected. Please contact support for more information.";
        
      await storage.createNotification({
        userId: userId,
        title: "Account Rejected",
        message: message,
        type: "error"
      });
      
      res.json(rejectedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject user" });
    }
  });

  // Product Reviews and Rating System
  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { minRating, maxRating, limit = 10, offset = 0 } = req.query;
      
      let reviews = await storage.getProductReviews(productId);
      
      // Filter by rating if specified
      if (minRating) {
        reviews = reviews.filter(review => review.rating >= parseInt(minRating as string));
      }
      if (maxRating) {
        reviews = reviews.filter(review => review.rating <= parseInt(maxRating as string));
      }
      
      // Apply pagination
      const startIndex = parseInt(offset as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedReviews = reviews.slice(startIndex, endIndex);
      
      // Get user details for each review
      const reviewsWithUsers = await Promise.all(
        paginatedReviews.map(async (review) => {
          const user = await storage.getUser(review.customerId);
          return {
            ...review,
            customer: user ? {
              id: user.id,
              username: user.username,
              fullName: user.fullName
            } : null
          };
        })
      );
      
      res.json(reviewsWithUsers);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = {
        ...req.body,
        isApproved: true, // Auto-approve reviews for now
        isVerifiedPurchase: false // TODO: Check if user actually purchased the product
      };
      
      // Validate the review data
      const validatedData = {
        productId: reviewData.productId,
        customerId: reviewData.customerId,
        rating: reviewData.rating,
        title: reviewData.title || null,
        comment: reviewData.comment || null,
        images: reviewData.images || [],
        orderId: reviewData.orderId || null,
        isVerifiedPurchase: reviewData.isVerifiedPurchase,
        isApproved: reviewData.isApproved
      };
      
      // Check if user already reviewed this product
      const existingReviews = await storage.getProductReviews(validatedData.productId);
      const userAlreadyReviewed = existingReviews.some(review => review.customerId === validatedData.customerId);
      
      if (userAlreadyReviewed) {
        return res.status(400).json({ error: "You have already reviewed this product" });
      }
      
      const review = await storage.createProductReview(validatedData);
      
      // Get user details for response
      const user = await storage.getUser(review.customerId);
      const reviewWithUser = {
        ...review,
        customer: user ? {
          id: user.id,
          username: user.username,
          fullName: user.fullName
        } : null
      };
      
      res.json(reviewWithUser);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ error: "Failed to create review" });
    }
  });

  app.patch("/api/reviews/:reviewId", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.reviewId);
      const updates = req.body;
      
      const updatedReview = await storage.updateProductReview(reviewId, updates);
      
      if (!updatedReview) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json(updatedReview);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(400).json({ error: "Failed to update review" });
    }
  });

  app.delete("/api/reviews/:reviewId", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.reviewId);
      
      // TODO: Add authorization check to ensure user can delete this review
      const success = await storage.deleteProductReview(reviewId);
      
      if (!success) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  app.get("/api/stores/:storeId/reviews", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const reviews = await storage.getStoreReviews(storeId);
      
      // Get user details for each review
      const reviewsWithUsers = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.customerId);
          return {
            ...review,
            customer: user ? {
              id: user.id,
              username: user.username,
              fullName: user.fullName
            } : null
          };
        })
      );
      
      res.json(reviewsWithUsers);
    } catch (error) {
      console.error("Error fetching store reviews:", error);
      res.status(500).json({ error: "Failed to fetch store reviews" });
    }
  });

  // Enhanced admin API routes for comprehensive management
  
  // All orders for admin
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      res.json(allOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Update order status
  app.put("/api/admin/orders/:id/status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Payment transactions management
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Coupons management
  app.get("/api/admin/coupons", async (req, res) => {
    try {
      const coupons = await storage.getAllCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupons" });
    }
  });

  app.post("/api/admin/coupons", async (req, res) => {
    try {
      const couponData = req.body;
      const coupon = await storage.createCoupon(couponData);
      res.json(coupon);
    } catch (error) {
      res.status(400).json({ error: "Failed to create coupon" });
    }
  });

  app.put("/api/admin/coupons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const coupon = await storage.updateCoupon(id, updates);
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ error: "Failed to update coupon" });
    }
  });

  app.delete("/api/admin/coupons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCoupon(id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete coupon" });
    }
  });

  // Banners management
  app.get("/api/admin/banners", async (req, res) => {
    try {
      const banners = await storage.getAllBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });

  app.post("/api/admin/banners", async (req, res) => {
    try {
      const bannerData = req.body;
      const banner = await storage.createBanner(bannerData);
      res.json(banner);
    } catch (error) {
      res.status(400).json({ error: "Failed to create banner" });
    }
  });

  app.put("/api/admin/banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const banner = await storage.updateBanner(id, updates);
      res.json(banner);
    } catch (error) {
      res.status(500).json({ error: "Failed to update banner" });
    }
  });

  app.delete("/api/admin/banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBanner(id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete banner" });
    }
  });

  // Support tickets management
  app.get("/api/admin/support-tickets", async (req, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch support tickets" });
    }
  });

  app.post("/api/admin/support-tickets", async (req, res) => {
    try {
      const ticketData = req.body;
      const ticket = await storage.createSupportTicket(ticketData);
      res.json(ticket);
    } catch (error) {
      res.status(400).json({ error: "Failed to create support ticket" });
    }
  });

  app.put("/api/admin/support-tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const ticket = await storage.updateSupportTicket(id, updates);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: "Failed to update support ticket" });
    }
  });

  // Product management
  app.put("/api/admin/products/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      const product = await storage.updateProduct(id, { isActive });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product status" });
    }
  });

  app.put("/api/admin/products/:id/featured", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isFeatured } = req.body;
      const product = await storage.updateProduct(id, { isActive: isFeatured });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product featured status" });
    }
  });

  // User management (ban/suspend)
  app.put("/api/admin/users/:id/ban", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const user = await storage.updateUser(id, { status: "suspended" });
      
      await storage.createNotification({
        userId: id,
        title: "Account Suspended",
        message: reason || "Your account has been suspended. Please contact support.",
        type: "error"
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.put("/api/admin/users/:id/unban", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.updateUser(id, { status: "active" });
      
      await storage.createNotification({
        userId: id,
        title: "Account Restored",
        message: "Your account has been restored and is now active.",
        type: "success"
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  // Enhanced Admin Panel API Routes
  
  // Dashboard stats
  app.get("/api/admin/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Enhanced User Management
  app.patch("/api/admin/users/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const user = await storage.updateUser(id, { status });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Product Management - Enhanced
  app.get("/api/admin/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.patch("/api/admin/products/bulk-status", async (req, res) => {
    try {
      const { productIds, status } = req.body;
      const success = await storage.bulkUpdateProductStatus(productIds, status);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to update product status" });
    }
  });

  // Product Attributes Management
  app.get("/api/admin/products/:productId/attributes", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const attributes = await storage.getProductAttributes(productId);
      res.json(attributes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product attributes" });
    }
  });

  app.post("/api/admin/products/:productId/attributes", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const attributeData = { ...req.body, productId };
      const attribute = await storage.createProductAttribute(attributeData);
      res.json(attribute);
    } catch (error) {
      res.status(400).json({ error: "Failed to create product attribute" });
    }
  });

  app.delete("/api/admin/product-attributes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProductAttribute(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product attribute" });
    }
  });

  // Enhanced Order Management
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const orders = await storage.getOrdersWithDetails();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Payment & Transactions Management
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Vendor/Seller Management
  app.get("/api/admin/vendor-verifications", async (req, res) => {
    try {
      const verifications = await storage.getAllVendorVerifications();
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor verifications" });
    }
  });

  app.patch("/api/admin/vendor-verifications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const verification = await storage.updateVendorVerification(id, updates);
      res.json(verification);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vendor verification" });
    }
  });

  // Commission Management
  app.get("/api/admin/commissions", async (req, res) => {
    try {
      const commissions = await storage.getAllCommissions();
      res.json(commissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch commissions" });
    }
  });

  app.post("/api/admin/commissions", async (req, res) => {
    try {
      const commissionData = req.body;
      const commission = await storage.createCommission(commissionData);
      res.json(commission);
    } catch (error) {
      res.status(400).json({ error: "Failed to create commission" });
    }
  });

  app.patch("/api/admin/commissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const commission = await storage.updateCommission(id, updates);
      res.json(commission);
    } catch (error) {
      res.status(500).json({ error: "Failed to update commission" });
    }
  });

  // Security & Fraud Management
  app.get("/api/admin/fraud-alerts", async (req, res) => {
    try {
      const alerts = await storage.getAllFraudAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fraud alerts" });
    }
  });

  app.post("/api/admin/fraud-alerts", async (req, res) => {
    try {
      const alertData = req.body;
      const alert = await storage.createFraudAlert(alertData);
      res.json(alert);
    } catch (error) {
      res.status(400).json({ error: "Failed to create fraud alert" });
    }
  });

  app.patch("/api/admin/fraud-alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const alert = await storage.updateFraudAlert(id, updates);
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update fraud alert" });
    }
  });

  // Admin Activity Logs
  app.get("/api/admin/logs", async (req, res) => {
    try {
      const adminId = req.query.adminId ? parseInt(req.query.adminId as string) : undefined;
      const logs = await storage.getAdminLogs(adminId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin logs" });
    }
  });

  app.post("/api/admin/logs", async (req, res) => {
    try {
      const logData = req.body;
      const log = await storage.logAdminAction(logData);
      res.json(log);
    } catch (error) {
      res.status(400).json({ error: "Failed to create admin log" });
    }
  });

  // Enhanced Analytics
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const [revenue, users, inventory] = await Promise.all([
        storage.getRevenueAnalytics(days),
        storage.getUsersAnalytics(),
        storage.getInventoryAlerts()
      ]);
      
      res.json({
        revenue,
        users,
        inventory
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/analytics/revenue", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const revenue = await storage.getRevenueAnalytics(days);
      res.json(revenue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue analytics" });
    }
  });

  app.get("/api/admin/analytics/users", async (req, res) => {
    try {
      const users = await storage.getUsersAnalytics();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user analytics" });
    }
  });

  // Inventory Alerts
  app.get("/api/admin/inventory/alerts", async (req, res) => {
    try {
      const alerts = await storage.getInventoryAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory alerts" });
    }
  });

  // Store Management
  app.get("/api/admin/stores", async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stores" });
    }
  });

  // Site settings management
  app.get("/api/admin/site-settings", async (req, res) => {
    try {
      const settings = await storage.getAllSiteSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/site-settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      const setting = await storage.updateSiteSetting(key, value);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Security and Fraud Detection
  app.get("/api/admin/fraud-alerts", async (req, res) => {
    try {
      const alerts = await storage.getAllFraudAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fraud alerts" });
    }
  });

  app.post("/api/admin/fraud-alerts", async (req, res) => {
    try {
      const alertData = insertFraudAlertSchema.parse(req.body);
      const alert = await storage.createFraudAlert(alertData);
      res.json(alert);
    } catch (error) {
      res.status(400).json({ error: "Failed to create fraud alert" });
    }
  });

  app.put("/api/admin/fraud-alerts/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const alert = await storage.updateFraudAlertStatus(id, status);
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update fraud alert" });
    }
  });

  // Vendor Verification Management
  app.get("/api/admin/vendor-verifications", async (req, res) => {
    try {
      const verifications = await storage.getAllVendorVerifications();
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor verifications" });
    }
  });

  app.put("/api/admin/vendor-verifications/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { adminId } = req.body;
      const verification = await storage.approveVendorVerification(id, adminId);
      res.json(verification);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve verification" });
    }
  });

  app.put("/api/admin/vendor-verifications/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { adminId, reason } = req.body;
      const verification = await storage.rejectVendorVerification(id, adminId, reason);
      res.json(verification);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject verification" });
    }
  });

  // Commission Management
  app.get("/api/admin/commissions", async (req, res) => {
    try {
      const status = req.query.status as string;
      const commissions = await storage.getCommissions(status);
      res.json(commissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch commissions" });
    }
  });

  app.put("/api/admin/commissions/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const commission = await storage.updateCommissionStatus(id, status);
      res.json(commission);
    } catch (error) {
      res.status(500).json({ error: "Failed to update commission status" });
    }
  });

  // Enhanced Dashboard Statistics
  app.get("/api/admin/dashboard/stats", async (req, res) => {
    try {
      const [
        totalUsers,
        totalStores,
        totalOrders,
        totalRevenue,
        pendingOrders,
        activeUsers,
        pendingVerifications,
        fraudAlerts
      ] = await Promise.all([
        storage.getTotalUsersCount(),
        storage.getTotalStoresCount(),
        storage.getTotalOrdersCount(),
        storage.getTotalRevenue(),
        storage.getPendingOrdersCount(),
        storage.getActiveUsersCount(),
        storage.getPendingVendorVerificationsCount(),
        storage.getOpenFraudAlertsCount()
      ]);

      res.json({
        totalUsers,
        totalStores,
        totalOrders,
        totalRevenue,
        pendingOrders,
        activeUsers,
        pendingVerifications,
        fraudAlerts
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Notification routes
  app.get("/api/notifications/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/user/:userId/read-all", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      res.status(400).json({ error: "Invalid notification data" });
    }
  });

  // Simplified notification polling endpoint
  app.get("/api/notifications/stream/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Website analytics routes
  app.get("/api/admin/analytics/stats", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getVisitStats(days);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/analytics/visits", async (req, res) => {
    try {
      const page = req.query.page as string;
      const visits = await storage.getPageViews(page);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch page views" });
    }
  });

  // Notifications routes
  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      res.status(400).json({ error: "Failed to create notification" });
    }
  });

  app.get("/api/notifications/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/user/:userId/read-all", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const success = await storage.markAllNotificationsAsRead(userId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Order tracking routes
  app.post("/api/orders/:orderId/tracking", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { status, description, location } = req.body;
      
      const tracking = await storage.updateOrderTracking(orderId, status, description, location);
      
      // Create notification for customer
      const order = await storage.getOrder(orderId);
      if (order) {
        await storage.createNotification({
          userId: order.customerId,
          title: "Order Status Updated",
          message: `Your order #${orderId} status has been updated to: ${status}`,
          type: "info",
          orderId: orderId
        });
      }
      
      res.json(tracking);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order tracking" });
    }
  });

  app.get("/api/orders/:orderId/tracking", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const tracking = await storage.getOrderTracking(orderId);
      res.json(tracking);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order tracking" });
    }
  });

  // Return policy routes
  app.post("/api/stores/:storeId/return-policy", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const policyData = { ...insertReturnPolicySchema.parse(req.body), storeId };
      const policy = await storage.createReturnPolicy(policyData);
      res.json(policy);
    } catch (error) {
      res.status(400).json({ error: "Failed to create return policy" });
    }
  });

  app.get("/api/stores/:storeId/return-policy", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const policy = await storage.getReturnPolicy(storeId);
      res.json(policy);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch return policy" });
    }
  });

  app.put("/api/stores/:storeId/return-policy", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const updates = req.body;
      const policy = await storage.updateReturnPolicy(storeId, updates);
      res.json(policy);
    } catch (error) {
      res.status(500).json({ error: "Failed to update return policy" });
    }
  });

  // Returns routes
  app.post("/api/returns", async (req, res) => {
    try {
      const returnData = insertReturnSchema.parse(req.body);
      const returnItem = await storage.createReturn(returnData);
      
      // Create notification for store owner
      const orderItem = await storage.getOrderItems(returnData.orderId);
      if (orderItem.length > 0) {
        const store = await storage.getStore(orderItem[0].storeId);
        if (store) {
          await storage.createNotification({
            userId: store.ownerId,
            title: "New Return Request",
            message: `A return request has been submitted for order #${returnData.orderId}`,
            type: "warning",
            orderId: returnData.orderId
          });
        }
      }
      
      res.json(returnItem);
    } catch (error) {
      res.status(400).json({ error: "Failed to create return request" });
    }
  });

  app.get("/api/returns/customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const returns = await storage.getReturnsByCustomer(customerId);
      res.json(returns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer returns" });
    }
  });

  app.get("/api/returns/store/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const returns = await storage.getReturnsByStore(storeId);
      res.json(returns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch store returns" });
    }
  });

  app.put("/api/returns/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const returnItem = await storage.updateReturnStatus(id, status);
      
      if (returnItem) {
        // Create notification for customer
        await storage.createNotification({
          userId: returnItem.customerId,
          title: "Return Status Updated",
          message: `Your return request status has been updated to: ${status}`,
          type: "info",
          orderId: returnItem.orderId
        });
      }
      
      res.json(returnItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update return status" });
    }
  });

  // Store distance calculation routes with filtering
  app.get("/api/stores/nearby", async (req, res) => {
    try {
      const { lat, lon, storeType } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      const userLat = parseFloat(lat as string);
      const userLon = parseFloat(lon as string);
      
      if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      
      const storesWithDistance = await storage.getStoresWithDistance(userLat, userLon, storeType as string);
      res.json(storesWithDistance);
    } catch (error) {
      console.error("Nearby stores fetch error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : error);
      res.status(500).json({ error: "Failed to fetch nearby stores" });
    }
  });

  // Get single store by ID (must come after /api/stores/nearby to avoid conflicts)
  app.get("/api/stores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const store = await storage.getStore(id);
      
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      
      res.json(store);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch store" });
    }
  });

  // Seller hub routes
  // Dashboard analytics for current user's store
  app.get("/api/seller/dashboard", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Get the user's store first
      const stores = await storage.getStoresByOwnerId(parseInt(userId as string));
      if (stores.length === 0) {
        return res.json({
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          averageRating: 0,
          totalReviews: 0
        });
      }
      
      const storeId = stores[0].id;
      const stats = await storage.getSellerDashboardStats(storeId);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/seller/analytics", async (req, res) => {
    try {
      const { userId, days } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Get the user's store first
      const stores = await storage.getStoresByOwnerId(parseInt(userId as string));
      if (stores.length === 0) {
        return res.json([]);
      }
      
      const storeId = stores[0].id;
      const analytics = await storage.getStoreAnalytics(storeId, parseInt(days as string) || 30);
      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Dashboard analytics with storeId (existing routes)
  app.get("/api/seller/dashboard/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const stats = await storage.getSellerDashboardStats(storeId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/seller/analytics/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const days = parseInt(req.query.days as string) || 30;
      const analytics = await storage.getStoreAnalytics(storeId, days);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.post("/api/seller/analytics", async (req, res) => {
    try {
      const analyticsData = insertStoreAnalyticsSchema.parse(req.body);
      const analytics = await storage.updateStoreAnalytics(analyticsData);
      res.json(analytics);
    } catch (error) {
      res.status(400).json({ error: "Failed to update analytics" });
    }
  });

  // Promotions management
  app.get("/api/seller/promotions/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const promotions = await storage.getStorePromotions(storeId);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  app.post("/api/seller/promotions", async (req, res) => {
    try {
      const promotionData = insertPromotionSchema.parse(req.body);
      const promotion = await storage.createPromotion(promotionData);
      res.json(promotion);
    } catch (error) {
      res.status(400).json({ error: "Failed to create promotion" });
    }
  });

  app.put("/api/seller/promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const promotion = await storage.updatePromotion(id, updates);
      res.json(promotion);
    } catch (error) {
      res.status(400).json({ error: "Failed to update promotion" });
    }
  });

  app.delete("/api/seller/promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePromotion(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete promotion" });
    }
  });

  // Advertisements management
  app.get("/api/seller/advertisements/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const ads = await storage.getStoreAdvertisements(storeId);
      res.json(ads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch advertisements" });
    }
  });

  app.post("/api/seller/advertisements", async (req, res) => {
    try {
      const adData = insertAdvertisementSchema.parse(req.body);
      const ad = await storage.createAdvertisement(adData);
      res.json(ad);
    } catch (error) {
      res.status(400).json({ error: "Failed to create advertisement" });
    }
  });

  app.put("/api/seller/advertisements/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const ad = await storage.updateAdvertisement(id, updates);
      res.json(ad);
    } catch (error) {
      res.status(400).json({ error: "Failed to update advertisement" });
    }
  });

  app.delete("/api/seller/advertisements/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAdvertisement(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete advertisement" });
    }
  });

  // Product reviews
  app.get("/api/seller/reviews/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const reviews = await storage.getStoreReviews(storeId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Settlements
  app.get("/api/seller/settlements/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const settlements = await storage.getStoreSettlements(storeId);
      res.json(settlements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settlements" });
    }
  });

  app.post("/api/seller/settlements", async (req, res) => {
    try {
      const settlementData = insertSettlementSchema.parse(req.body);
      const settlement = await storage.createSettlement(settlementData);
      res.json(settlement);
    } catch (error) {
      res.status(400).json({ error: "Failed to create settlement" });
    }
  });

  // Inventory management for current user's store
  app.get("/api/seller/inventory", async (req, res) => {
    try {
      const { userId, productId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Get the user's store first
      const stores = await storage.getStoresByOwnerId(parseInt(userId as string));
      if (stores.length === 0) {
        return res.json([]);
      }
      
      const storeId = stores[0].id;
      const logs = await storage.getInventoryLogs(storeId, productId ? parseInt(productId as string) : undefined);
      res.json(logs);
    } catch (error) {
      console.error("Inventory logs error:", error);
      res.status(500).json({ error: "Failed to fetch inventory logs" });
    }
  });

  // Inventory management with storeId (existing route)
  app.get("/api/seller/inventory/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const logs = await storage.getInventoryLogs(storeId, productId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory logs" });
    }
  });

  app.post("/api/seller/inventory/update", async (req, res) => {
    try {
      const { productId, quantity, type, reason } = req.body;
      const success = await storage.updateProductStock(productId, quantity, type, reason);
      res.json({ success });
    } catch (error) {
      res.status(400).json({ error: "Failed to update inventory" });
    }
  });

  // Enhanced order creation with notifications
  app.post("/api/orders/enhanced", async (req, res) => {
    try {
      const { order, items } = req.body;
      const orderData = insertOrderSchema.parse(order);
      
      // Create the order
      const createdOrder = await storage.createOrder(orderData);
      
      // Create order items and notify store owners
      const storeOwners = new Set<number>();
      for (const item of items) {
        await storage.createOrderItem({
          orderId: createdOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          storeId: item.storeId
        });
        
        // Track store owners for notifications
        const store = await storage.getStore(item.storeId);
        if (store) {
          storeOwners.add(store.ownerId);
        }
      }
      
      // Clear customer's cart
      await storage.clearCart(orderData.customerId);
      
      // Create order tracking
      await storage.createOrderTracking({
        orderId: createdOrder.id,
        status: "pending",
        description: "Order placed successfully"
      });
      
      // Send notifications to store owners
      for (const ownerId of Array.from(storeOwners)) {
        await storage.createNotification({
          userId: ownerId,
          title: "New Order Received",
          message: `New order #${createdOrder.id} received from ${orderData.customerName}`,
          type: "success",
          orderId: createdOrder.id
        });
      }
      
      // Send confirmation notification to customer
      await storage.createNotification({
        userId: orderData.customerId,
        title: "Order Confirmed",
        message: `Your order #${createdOrder.id} has been confirmed and is being processed`,
        type: "success",
        orderId: createdOrder.id
      });
      
      res.json({ order: createdOrder, success: true });
    } catch (error) {
      console.error("Enhanced order creation error:", error);
      res.status(400).json({ error: "Failed to create order" });
    }
  });

  // Delivery Partner Routes
  app.post("/api/delivery-partners/signup", async (req, res) => {
    try {
      const deliveryPartnerData = insertDeliveryPartnerSchema.parse(req.body);
      const partner = await storage.createDeliveryPartner(deliveryPartnerData);
      
      res.json(partner);
    } catch (error) {
      console.error("Delivery partner signup error:", error);
      res.status(400).json({ error: "Failed to create delivery partner application" });
    }
  });

  app.get("/api/delivery-partners", async (req, res) => {
    try {
      const partners = await storage.getAllDeliveryPartners();
      res.json(partners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery partners" });
    }
  });

  app.get("/api/delivery-partners/pending", async (req, res) => {
    try {
      const pendingPartners = await storage.getPendingDeliveryPartners();
      res.json(pendingPartners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending delivery partners" });
    }
  });

  app.get("/api/delivery-partners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partner = await storage.getDeliveryPartner(id);
      if (!partner) {
        return res.status(404).json({ error: "Delivery partner not found" });
      }
      res.json(partner);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery partner" });
    }
  });

  app.get("/api/delivery-partners/user", async (req, res) => {
    console.log("=== DELIVERY PARTNER USER ROUTE HIT ===");
    console.log("Query params:", req.query);
    console.log("Headers:", req.headers['user-id']);
    try {
      const userId = req.query.userId || req.headers['user-id'];
      console.log("Extracted userId:", userId, "Type:", typeof userId);
      
      if (!userId) {
        console.log("No userId provided");
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const parsedUserId = parseInt(userId as string);
      console.log("Parsed userId:", parsedUserId);
      
      const partner = await storage.getDeliveryPartnerByUserId(parsedUserId);
      console.log("Partner result:", partner);
      
      if (!partner) {
        console.log("No partner found for userId:", parsedUserId);
        return res.status(404).json({ error: "Delivery partner not found" });
      }
      
      console.log("Returning partner:", partner);
      res.json(partner);
    } catch (error) {
      console.error("Error in delivery partner user route:", error);
      res.status(500).json({ error: "Failed to fetch delivery partner" });
    }
  });

  app.put("/api/delivery-partners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const partner = await storage.updateDeliveryPartner(id, updates);
      res.json(partner);
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery partner" });
    }
  });

  app.post("/api/delivery-partners/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { adminId } = req.body;
      const partner = await storage.approveDeliveryPartner(id, adminId);
      
      if (partner) {
        // Create notification for delivery partner
        await storage.createNotification({
          userId: partner.userId,
          title: "Application Approved",
          message: "Congratulations! Your delivery partner application has been approved. You can now start accepting deliveries.",
          type: "success"
        });
      }
      
      res.json(partner);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve delivery partner" });
    }
  });

  app.post("/api/delivery-partners/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { adminId, reason } = req.body;
      const partner = await storage.rejectDeliveryPartner(id, adminId, reason);
      
      if (partner) {
        // Create notification for delivery partner
        await storage.createNotification({
          userId: partner.userId,
          title: "Application Rejected",
          message: `Your delivery partner application has been rejected. Reason: ${reason}`,
          type: "error"
        });
      }
      
      res.json(partner);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject delivery partner" });
    }
  });

  // Delivery Routes
  app.post("/api/deliveries", async (req, res) => {
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      const delivery = await storage.createDelivery(deliveryData);
      res.json(delivery);
    } catch (error) {
      res.status(400).json({ error: "Failed to create delivery" });
    }
  });

  app.get("/api/deliveries/partner/:partnerId", async (req, res) => {
    try {
      const partnerId = parseInt(req.params.partnerId);
      const deliveries = await storage.getDeliveriesByPartnerId(partnerId);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partner deliveries" });
    }
  });

  app.get("/api/deliveries/order/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const deliveries = await storage.getDeliveriesByOrderId(orderId);
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order deliveries" });
    }
  });

  app.put("/api/deliveries/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, partnerId } = req.body;
      const delivery = await storage.updateDeliveryStatus(id, status, partnerId);
      
      if (delivery) {
        // Create notification for customer about delivery status update
        const order = await storage.getOrder(delivery.orderId);
        if (order) {
          await storage.createNotification({
            userId: order.customerId,
            title: "Delivery Status Updated",
            message: `Your delivery status has been updated to: ${status}`,
            type: "info",
            orderId: delivery.orderId
          });
        }
      }
      
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery status" });
    }
  });

  app.post("/api/deliveries/:deliveryId/assign/:partnerId", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.deliveryId);
      const partnerId = parseInt(req.params.partnerId);
      const delivery = await storage.assignDeliveryToPartner(deliveryId, partnerId);
      
      if (delivery) {
        // Create notification for delivery partner
        const partner = await storage.getDeliveryPartner(partnerId);
        if (partner) {
          await storage.createNotification({
            userId: partner.userId,
            title: "New Delivery Assigned",
            message: `You have been assigned a new delivery. Please check your dashboard for details.`,
            type: "info"
          });
        }
      }
      
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign delivery" });
    }
  });

  // Delivery Partner Comprehensive API Endpoints
  app.get("/api/delivery-notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery notifications" });
    }
  });

  app.get("/api/deliveries/active", async (req, res) => {
    try {
      // Return empty array for now - will be populated when orders with deliveries exist
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active deliveries" });
    }
  });

  app.get("/api/deliveries/active-tracking", async (req, res) => {
    try {
      // Return empty array for now - will be populated when tracking is needed
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tracking data" });
    }
  });

  app.get("/api/delivery-notifications", async (req, res) => {
    try {
      // Return empty array for now - notifications will be added as needed
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/deliveries/active/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const partner = await storage.getDeliveryPartnerByUserId(userId);
      if (!partner) {
        return res.json([]);
      }
      
      const deliveries = await storage.getDeliveriesByPartnerId(partner.id);
      const activeDeliveries = deliveries.filter(d => 
        ['assigned', 'picked_up', 'in_transit'].includes(d.status)
      );
      
      res.json(activeDeliveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active deliveries" });
    }
  });

  app.get("/api/deliveries/active-tracking/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const partner = await storage.getDeliveryPartnerByUserId(userId);
      if (!partner) {
        return res.json(null);
      }
      
      const deliveries = await storage.getDeliveriesByPartnerId(partner.id);
      const activeDelivery = deliveries.find(d => 
        ['assigned', 'picked_up', 'in_transit'].includes(d.status)
      );
      
      res.json(activeDelivery || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active delivery tracking" });
    }
  });

  app.post("/api/deliveries/:id/accept", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { partnerId } = req.body;
      
      const delivery = await storage.updateDeliveryStatus(id, 'assigned', partnerId);
      
      if (delivery) {
        await storage.createNotification({
          userId: partnerId,
          title: "Delivery Accepted",
          message: `You have successfully accepted delivery for Order #${delivery.orderId}`,
          type: "success"
        });
      }
      
      res.json({ success: true, delivery });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept delivery" });
    }
  });

  app.put("/api/delivery-notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.put("/api/deliveries/:id/location", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { location } = req.body;
      
      // Simplified location update - just return success for now
      res.json({ success: true, message: "Location tracking will be available soon" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery location" });
    }
  });

  app.post("/api/deliveries/upload-proof", async (req, res) => {
    try {
      const { deliveryId } = req.body;
      // Simplified proof upload - just return success for now
      res.json({ success: true, message: "Proof upload will be available soon" });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload proof" });
    }
  });

  // Delivery Zone routes
  app.get("/api/delivery-zones", async (req, res) => {
    try {
      // Mock delivery zones data for Siraha, Nepal area
      const mockZones = [
        {
          id: 1,
          name: "Inner City",
          minDistance: "0",
          maxDistance: "5",
          baseFee: "30.00",
          perKmRate: "5.00",
          isActive: true
        },
        {
          id: 2,
          name: "Suburban",
          minDistance: "5.01",
          maxDistance: "15",
          baseFee: "50.00",
          perKmRate: "8.00",
          isActive: true
        },
        {
          id: 3,
          name: "Rural",
          minDistance: "15.01",
          maxDistance: "30",
          baseFee: "80.00",
          perKmRate: "12.00",
          isActive: true
        },
        {
          id: 4,
          name: "Extended Rural",
          minDistance: "30.01",
          maxDistance: "100",
          baseFee: "120.00",
          perKmRate: "15.00",
          isActive: true
        }
      ];
      res.json(mockZones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery zones" });
    }
  });

  app.get("/api/admin/delivery-zones", async (req, res) => {
    try {
      const zones = await storage.getAllDeliveryZones();
      res.json(zones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch delivery zones" });
    }
  });

  app.post("/api/admin/delivery-zones", async (req, res) => {
    try {
      // Simplified delivery zone creation - using basic delivery schema
      const zoneData = insertDeliverySchema.parse(req.body);
      res.json({ success: true, message: "Delivery zone management will be available soon" });
    } catch (error) {
      res.status(400).json({ error: "Invalid delivery zone data" });
    }
  });

  app.put("/api/admin/delivery-zones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const zone = await storage.updateDeliveryZone(parseInt(id), updateData);
      res.json(zone);
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery zone" });
    }
  });

  app.delete("/api/admin/delivery-zones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDeliveryZone(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete delivery zone" });
    }
  });

  // Calculate delivery fee based on distance
  app.post("/api/calculate-delivery-fee", async (req, res) => {
    try {
      const { distance } = req.body;
      if (typeof distance !== 'number' || distance < 0) {
        return res.status(400).json({ error: "Invalid distance value" });
      }
      
      // Use mock zones for calculation
      const mockZones = [
        { id: 1, name: "Inner City", minDistance: "0", maxDistance: "5", baseFee: "30.00", perKmRate: "5.00", isActive: true },
        { id: 2, name: "Suburban", minDistance: "5.01", maxDistance: "15", baseFee: "50.00", perKmRate: "8.00", isActive: true },
        { id: 3, name: "Rural", minDistance: "15.01", maxDistance: "30", baseFee: "80.00", perKmRate: "12.00", isActive: true },
        { id: 4, name: "Extended Rural", minDistance: "30.01", maxDistance: "100", baseFee: "120.00", perKmRate: "15.00", isActive: true }
      ];
      
      // Find applicable zone
      const applicableZone = mockZones.find(zone => {
        const minDist = parseFloat(zone.minDistance);
        const maxDist = parseFloat(zone.maxDistance);
        return distance >= minDist && distance <= maxDist;
      });

      let fee = 100; // Default fee
      let zone = null;
      
      if (applicableZone) {
        const baseFee = parseFloat(applicableZone.baseFee);
        const perKmRate = parseFloat(applicableZone.perKmRate);
        fee = baseFee + (distance * perKmRate);
        zone = applicableZone;
      }

      res.json({ 
        fee: Math.round(fee * 100) / 100, 
        zone,
        distance: Math.round(distance * 100) / 100,
        breakdown: zone ? {
          baseFee: parseFloat(zone.baseFee),
          distanceFee: Math.round((distance * parseFloat(zone.perKmRate)) * 100) / 100,
          totalFee: Math.round(fee * 100) / 100
        } : null
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate delivery fee" });
    }
  });

  // Notification status endpoint
  app.get('/api/notifications/status', (req, res) => {
    res.json({ 
      inAppNotifications: true,
      message: 'In-app notifications are available'
    });
  });

  // Test notification endpoint for demonstration
  app.post('/api/notifications/test', async (req, res) => {
    try {
      const { userId, type = 'order' } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const testNotifications = [
        {
          userId: parseInt(userId),
          type: 'order',
          title: 'New Order Received',
          message: 'You have a new order #12345 from John Doe worth ₹1,250',
          isRead: false
        },
        {
          userId: parseInt(userId),
          type: 'delivery',
          title: 'Order Out for Delivery',
          message: 'Your order #12344 is now out for delivery and will arrive in 30 minutes',
          isRead: false
        },
        {
          userId: parseInt(userId),
          type: 'payment',
          title: 'Payment Received',
          message: 'Payment of ₹850 has been credited to your account',
          isRead: false
        },
        {
          userId: parseInt(userId),
          type: 'success',
          title: 'Store Verification Complete',
          message: 'Congratulations! Your store has been verified and is now live',
          isRead: false
        }
      ];

      // Create a random test notification
      const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
      const notification = await storage.createNotification(randomNotification);
      
      res.json({ success: true, notification });
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({ error: 'Failed to create test notification' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
