import { 
  users, stores, categories, products, orders, orderItems, cartItems,
  type User, type InsertUser, type Store, type InsertStore, 
  type Category, type InsertCategory, type Product, type InsertProduct,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Store operations
  getStore(id: number): Promise<Store | undefined>;
  getStoresByOwnerId(ownerId: number): Promise<Store[]>;
  getAllStores(): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, updates: Partial<InsertStore>): Promise<Store | undefined>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByStoreId(storeId: number): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByCustomerId(customerId: number): Promise<Order[]>;
  getOrdersByStoreId(storeId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Order item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Cart operations
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private stores: Map<number, Store> = new Map();
  private categories: Map<number, Category> = new Map();
  private products: Map<number, Product> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem> = new Map();
  private cartItems: Map<number, CartItem> = new Map();
  
  private currentUserId = 1;
  private currentStoreId = 1;
  private currentCategoryId = 1;
  private currentProductId = 1;
  private currentOrderId = 1;
  private currentOrderItemId = 1;
  private currentCartItemId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create sample categories
    const categories = [
      { name: "Groceries", slug: "groceries" },
      { name: "Clothing", slug: "clothing" },
      { name: "Electronics", slug: "electronics" },
      { name: "Home & Kitchen", slug: "home-kitchen" },
      { name: "Books", slug: "books" },
      { name: "Sports", slug: "sports" }
    ];

    categories.forEach(cat => {
      this.createCategory(cat);
    });

    // Create sample users
    const sampleUsers = [
      { email: "customer@example.com", password: "password123", fullName: "John Doe", phone: "+977-9841234567", role: "customer" },
      { email: "shopkeeper@example.com", password: "password123", fullName: "Ram Kumar", phone: "+977-9841234568", role: "shopkeeper" },
      { email: "shopkeeper2@example.com", password: "password123", fullName: "Sita Devi", phone: "+977-9841234569", role: "shopkeeper" }
    ];

    sampleUsers.forEach(user => {
      this.createUser(user);
    });

    // Create sample stores
    const sampleStores = [
      { name: "Ram General Store", description: "Your trusted neighborhood store for all daily needs", ownerId: 2, address: "Main Bazaar, Siraha-56600", phone: "+977-9841234568", rating: "4.5", totalReviews: 120 },
      { name: "Sita Fashion House", description: "Traditional clothing and ethnic wear", ownerId: 3, address: "Fashion Street, Siraha-56600", phone: "+977-9841234569", rating: "4.8", totalReviews: 89 }
    ];

    sampleStores.forEach(store => {
      this.createStore(store);
    });

    // Create sample products
    const sampleProducts = [
      { name: "Fresh Red Apples", description: "Fresh, crispy red apples directly from local orchards", price: "120", originalPrice: "150", categoryId: 1, storeId: 1, stock: 50, images: ["https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"], rating: "4.2", totalReviews: 156 },
      { name: "Premium Basmati Rice", description: "Long grain aromatic basmati rice", price: "120", originalPrice: "150", categoryId: 1, storeId: 1, stock: 100, images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"], rating: "4.5", totalReviews: 89 },
      { name: "Handwoven Saree", description: "Beautiful traditional handwoven saree", price: "2500", originalPrice: "3000", categoryId: 2, storeId: 2, stock: 25, images: ["https://images.unsplash.com/photo-1582408921715-18e7806365c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"], rating: "4.8", totalReviews: 45 },
      { name: "Local Spices Collection", description: "Authentic local spices and seasonings", price: "350", originalPrice: "400", categoryId: 1, storeId: 1, stock: 30, images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"], rating: "4.6", totalReviews: 73 },
      { name: "Fresh Vegetables", description: "Daily fresh vegetables from local farms", price: "200", originalPrice: "250", categoryId: 1, storeId: 1, stock: 40, images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"], rating: "4.3", totalReviews: 92 },
      { name: "Dairy Products", description: "Fresh milk and dairy products", price: "120", originalPrice: "140", categoryId: 1, storeId: 1, stock: 20, images: ["https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"], rating: "4.4", totalReviews: 67 }
    ];

    sampleProducts.forEach(product => {
      this.createProduct(product);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getStoresByOwnerId(ownerId: number): Promise<Store[]> {
    return Array.from(this.stores.values()).filter(store => store.ownerId === ownerId);
  }

  async getAllStores(): Promise<Store[]> {
    return Array.from(this.stores.values()).filter(store => store.isActive);
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const id = this.currentStoreId++;
    const store: Store = {
      ...insertStore,
      id,
      rating: insertStore.rating || "0.00",
      totalReviews: insertStore.totalReviews || 0,
      isActive: insertStore.isActive !== undefined ? insertStore.isActive : true,
      createdAt: new Date(),
    };
    this.stores.set(id, store);
    return store;
  }

  async updateStore(id: number, updates: Partial<InsertStore>): Promise<Store | undefined> {
    const store = this.stores.get(id);
    if (!store) return undefined;
    
    const updatedStore = { ...store, ...updates };
    this.stores.set(id, updatedStore);
    return updatedStore;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByStoreId(storeId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.storeId === storeId && product.isActive
    );
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isActive);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.categoryId === categoryId && product.isActive
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(
      product => 
        product.isActive && 
        (product.name.toLowerCase().includes(lowercaseQuery) ||
         product.description?.toLowerCase().includes(lowercaseQuery))
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = {
      ...insertProduct,
      id,
      rating: insertProduct.rating || "0.00",
      totalReviews: insertProduct.totalReviews || 0,
      isActive: insertProduct.isActive !== undefined ? insertProduct.isActive : true,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByCustomerId(customerId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.customerId === customerId);
  }

  async getOrdersByStoreId(storeId: number): Promise<Order[]> {
    const orderItems = Array.from(this.orderItems.values()).filter(item => item.storeId === storeId);
    const orderIds = [...new Set(orderItems.map(item => item.orderId))];
    return orderIds.map(id => this.orders.get(id)).filter(Boolean) as Order[];
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = {
      ...insertOrder,
      id,
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Order item operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.currentOrderItemId++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.userId === userId);
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.userId === insertCartItem.userId && item.productId === insertCartItem.productId
    );

    if (existingItem) {
      // Update quantity
      const updatedItem = { ...existingItem, quantity: existingItem.quantity + insertCartItem.quantity };
      this.cartItems.set(existingItem.id, updatedItem);
      return updatedItem;
    } else {
      // Create new cart item
      const id = this.currentCartItemId++;
      const cartItem: CartItem = {
        ...insertCartItem,
        id,
        createdAt: new Date(),
      };
      this.cartItems.set(id, cartItem);
      return cartItem;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    if (quantity <= 0) {
      this.cartItems.delete(id);
      return undefined;
    }
    
    const updatedItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: number): Promise<boolean> {
    const userCartItems = Array.from(this.cartItems.entries()).filter(
      ([_, item]) => item.userId === userId
    );
    
    userCartItems.forEach(([id]) => {
      this.cartItems.delete(id);
    });
    
    return true;
  }
}

export const storage = new MemStorage();
