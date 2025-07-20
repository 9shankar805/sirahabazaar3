import type { 
  User, InsertUser, Store, InsertStore, Category, InsertCategory, 
  Product, InsertProduct, Order, InsertOrder, OrderItem, InsertOrderItem,
  CartItem, InsertCartItem, WishlistItem, InsertWishlistItem
} from "@shared/schema";
import { IStorage } from "./storage";

// Simple in-memory storage for development/fallback
export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private stores: Store[] = [];
  private categories: Category[] = [];
  private products: Product[] = [];
  private orders: Order[] = [];
  private orderItems: OrderItem[] = [];
  private cartItems: CartItem[] = [];
  private wishlistItems: WishlistItem[] = [];
  private nextId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize with sample categories
    const categories = [
      { name: "Electronics", icon: "smartphone" },
      { name: "Fashion", icon: "shirt" },
      { name: "Food & Beverages", icon: "utensils" },
      { name: "Health", icon: "heart" },
      { name: "Sports", icon: "dumbbell" }
    ];

    categories.forEach(cat => {
      this.categories.push({
        id: this.nextId++,
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        description: `${cat.name} products and services`,
        icon: cat.icon,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Create sample users (store owners)
    const locations = [
      { city: "Siraha", latitude: "26.6603", longitude: "86.2064" },
      { city: "Lahan", latitude: "26.7201", longitude: "86.4928" },
      { city: "Mirchaiya", latitude: "26.7815", longitude: "86.4926" },
      { city: "Golbazar", latitude: "26.7542", longitude: "86.5028" }
    ];

    // Create 20 retail stores
    const retailStores = [
      "Siraha Electronics Hub", "Fashion Palace Lahan", "Mirchaiya Book Store", "Golbazar Pharmacy",
      "Siraha Sports Center", "Lahan Mobile Shop", "Mirchaiya Grocery Store", "Golbazar Hardware Store",
      "Siraha Beauty Parlor", "Lahan Textile House", "Mirchaiya Computer Center", "Golbazar Gift Shop",
      "Siraha Furniture Mart", "Lahan Shoe Store", "Mirchaiya Stationary Hub", "Golbazar Auto Parts",
      "Siraha Kitchenware Store", "Lahan Music Center", "Mirchaiya Toy Store", "Golbazar Watch Shop"
    ];

    for (let i = 0; i < 20; i++) {
      const location = locations[i % locations.length];
      const userId = this.nextId++;
      
      // Create user
      this.users.push({
        id: userId,
        username: `retail${i + 1}`,
        email: `retail${i + 1}@siraha.com`,
        password: 'hashed_password',
        firebaseUid: null,
        fullName: `${retailStores[i]} Owner`,
        phone: `+977-98${String(i + 1).padStart(8, '0')}`,
        address: `${location.city} Main Market`,
        city: location.city,
        state: "Province 1",
        role: "shopkeeper",
        status: "active",
        approvalDate: new Date(),
        approvedBy: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create store
      this.stores.push({
        id: this.nextId++,
        name: retailStores[i],
        slug: retailStores[i].toLowerCase().replace(/\s+/g, '-'),
        description: `Quality products and services in ${location.city}`,
        ownerId: userId,
        address: `${location.city} Main Market, Ward ${i + 1}`,
        city: location.city,
        state: "Province 1",
        postalCode: "56700",
        country: "Nepal",
        latitude: location.latitude,
        longitude: location.longitude,
        phone: `+977-98${String(i + 1).padStart(8, '0')}`,
        website: `https://${retailStores[i].toLowerCase().replace(/\s+/g, '')}.com`,
        logo: "",
        coverImage: "",
        rating: "4.2",
        totalReviews: Math.floor(Math.random() * 100) + 10,
        featured: Math.random() > 0.7,
        isActive: true,
        storeType: "retail",
        cuisineType: null,
        deliveryTime: null,
        minimumOrder: null,
        deliveryFee: null,
        isDeliveryAvailable: Math.random() > 0.3,
        openingHours: "9:00 AM - 8:00 PM",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create 20 restaurants
    const restaurants = [
      "Siraha Spice Kitchen", "Lahan Momo Palace", "Mirchaiya Biryani House", "Golbazar Chinese Corner",
      "Siraha Pizza Hub", "Lahan Burger Joint", "Mirchaiya Thali House", "Golbazar BBQ Grill",
      "Siraha Sweet House", "Lahan Coffee House", "Mirchaiya Seafood Palace", "Golbazar Vegan Delight",
      "Siraha Chowmein Center", "Lahan Tiffin Service", "Mirchaiya Ice Cream Parlor", "Golbazar Sandwich Shop",
      "Siraha Traditional Kitchen", "Lahan Juice Bar", "Mirchaiya Breakfast Corner", "Golbazar Night Diner"
    ];

    const cuisineTypes = ['Nepali', 'Indian', 'Chinese', 'Italian', 'Fast Food', 'Continental'];

    for (let i = 0; i < 20; i++) {
      const location = locations[i % locations.length];
      const userId = this.nextId++;
      
      // Create user
      this.users.push({
        id: userId,
        username: `restaurant${i + 1}`,
        email: `restaurant${i + 1}@siraha.com`,
        password: 'hashed_password',
        firebaseUid: null,
        fullName: `${restaurants[i]} Owner`,
        phone: `+977-97${String(i + 1).padStart(8, '0')}`,
        address: `${location.city} Food Street`,
        city: location.city,
        state: "Province 1",
        role: "shopkeeper",
        status: "active",
        approvalDate: new Date(),
        approvedBy: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create restaurant
      this.stores.push({
        id: this.nextId++,
        name: restaurants[i],
        slug: restaurants[i].toLowerCase().replace(/\s+/g, '-'),
        description: `Delicious food and dining experience in ${location.city}`,
        ownerId: userId,
        address: `${location.city} Food Street, Block ${i + 1}`,
        city: location.city,
        state: "Province 1",
        postalCode: "56700",
        country: "Nepal",
        latitude: location.latitude,
        longitude: location.longitude,
        phone: `+977-97${String(i + 1).padStart(8, '0')}`,
        website: `https://${restaurants[i].toLowerCase().replace(/\s+/g, '')}.com`,
        logo: "",
        coverImage: "",
        rating: (Math.random() * 2 + 3).toFixed(1),
        totalReviews: Math.floor(Math.random() * 200) + 20,
        featured: Math.random() > 0.6,
        isActive: true,
        storeType: "restaurant",
        cuisineType: cuisineTypes[i % cuisineTypes.length],
        deliveryTime: `${20 + (i % 3) * 10}-${30 + (i % 3) * 10} mins`,
        minimumOrder: String(100 + (i % 5) * 50),
        deliveryFee: String(30 + (i % 4) * 20),
        isDeliveryAvailable: true,
        openingHours: "10:00 AM - 10:00 PM",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Add products to each store
    this.createSampleProducts();
  }

  private createSampleProducts() {
    // Products for retail stores
    const retailProducts = [
      // Electronics products
      { name: "Samsung Galaxy A54", category: "Electronics", price: "35000", description: "Latest smartphone with great camera", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400" },
      { name: "Sony Headphones WH-1000XM4", category: "Electronics", price: "25000", description: "Noise cancelling wireless headphones", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" },
      { name: "Dell Laptop Inspiron 15", category: "Electronics", price: "65000", description: "High performance laptop for work", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400" },
      { name: "iPhone 13", category: "Electronics", price: "85000", description: "Apple iPhone with advanced features", image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400" },
      { name: "Gaming Mouse Logitech", category: "Electronics", price: "3500", description: "Professional gaming mouse", image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400" },
      { name: "Bluetooth Speaker JBL", category: "Electronics", price: "8000", description: "Portable wireless speaker", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400" },
      { name: "Smart Watch Apple", category: "Electronics", price: "45000", description: "Fitness tracking smartwatch", image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400" },
      { name: "USB-C Cable", category: "Electronics", price: "500", description: "Fast charging cable", image: "https://images.unsplash.com/photo-1588200618911-3ce37ce14b96?w=400" },
      { name: "Power Bank 20000mAh", category: "Electronics", price: "2500", description: "High capacity portable charger", image: "https://images.unsplash.com/photo-1609592439674-37c0e2df3c8b?w=400" },
      { name: "Wireless Charger", category: "Electronics", price: "1800", description: "Qi wireless charging pad", image: "https://images.unsplash.com/photo-1586953710143-9b770ca6a4b3?w=400" },

      // Fashion products
      { name: "Men's Cotton T-Shirt", category: "Fashion", price: "800", description: "Comfortable casual wear", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400" },
      { name: "Women's Kurta Set", category: "Fashion", price: "2500", description: "Traditional ethnic wear", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400" },
      { name: "Denim Jeans", category: "Fashion", price: "2200", description: "Classic blue jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400" },
      { name: "Formal Shirt", category: "Fashion", price: "1500", description: "Office wear shirt", image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400" },
      { name: "Winter Jacket", category: "Fashion", price: "4500", description: "Warm winter clothing", image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400" },
      { name: "Sports Shoes", category: "Fashion", price: "3500", description: "Running and casual shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400" },
      { name: "Leather Wallet", category: "Fashion", price: "1200", description: "Genuine leather wallet", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400" },
      { name: "Wrist Watch", category: "Fashion", price: "5500", description: "Analog dress watch", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400" },
      { name: "Sunglasses", category: "Fashion", price: "2800", description: "UV protection eyewear", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400" },
      { name: "Handbag", category: "Fashion", price: "3200", description: "Women's fashion handbag", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" }
    ];

    // Food items for restaurants
    const restaurantFoodItems = [
      // Nepali cuisine
      { name: "Dal Bhat Tarkari", category: "Food & Beverages", price: "250", description: "Traditional Nepali meal with lentils, rice, and vegetables", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400" },
      { name: "Chicken Momo", category: "Food & Beverages", price: "180", description: "Steamed dumplings with chicken filling", image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400" },
      { name: "Buff Sekuwa", category: "Food & Beverages", price: "320", description: "Grilled buffalo meat with spices", image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400" },
      { name: "Newari Khaja Set", category: "Food & Beverages", price: "400", description: "Traditional Newari snack platter", image: "https://images.unsplash.com/photo-1504113888839-1c8eb50233d3?w=400" },
      { name: "Gundruk Soup", category: "Food & Beverages", price: "120", description: "Fermented leafy vegetable soup", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400" },
      { name: "Chicken Biryani", category: "Food & Beverages", price: "350", description: "Fragrant rice dish with spiced chicken", image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400" },
      { name: "Mutton Curry", category: "Food & Beverages", price: "450", description: "Spicy goat meat curry", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400" },
      { name: "Vegetable Fried Rice", category: "Food & Beverages", price: "200", description: "Stir-fried rice with mixed vegetables", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400" },
      { name: "Sel Roti", category: "Food & Beverages", price: "80", description: "Traditional ring-shaped rice bread", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400" },
      { name: "Lassi", category: "Food & Beverages", price: "100", description: "Refreshing yogurt-based drink", image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400" }
    ];

    // Add products to each store
    this.stores.forEach(store => {
      if (store.storeType === 'retail') {
        // Add 10 random retail products to each retail store
        for (let i = 0; i < 10; i++) {
          const productTemplate = retailProducts[i % retailProducts.length];
          this.products.push({
            id: this.nextId++,
            name: `${productTemplate.name} - ${store.name}`,
            slug: `${productTemplate.name.toLowerCase().replace(/\s+/g, '-')}-${store.id}`,
            description: productTemplate.description,
            price: productTemplate.price,
            originalPrice: (parseInt(productTemplate.price) * 1.2).toString(),
            categoryId: this.categories.find(c => c.name === productTemplate.category)?.id || 1,
            storeId: store.id,
            stock: Math.floor(Math.random() * 50) + 10,
            imageUrl: productTemplate.image,
            images: [productTemplate.image],
            rating: (Math.random() * 2 + 3).toFixed(1),
            totalReviews: Math.floor(Math.random() * 100) + 5,
            isActive: true,
            isFastSell: Math.random() > 0.8,
            isOnOffer: Math.random() > 0.7,
            offerPercentage: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : 0,
            offerEndDate: Math.random() > 0.7 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
            productType: "retail",
            preparationTime: null,
            ingredients: [],
            allergens: [],
            spiceLevel: null,
            isVegetarian: Math.random() > 0.5,
            isVegan: Math.random() > 0.7,
            nutritionInfo: null,
            createdAt: new Date()
          });
        }
      } else if (store.storeType === 'restaurant') {
        // Add 10 food items to each restaurant
        for (let i = 0; i < 10; i++) {
          const foodTemplate = restaurantFoodItems[i % restaurantFoodItems.length];
          const spiceLevels = ['mild', 'medium', 'hot'];
          this.products.push({
            id: this.nextId++,
            name: `${foodTemplate.name} - ${store.name}`,
            slug: `${foodTemplate.name.toLowerCase().replace(/\s+/g, '-')}-${store.id}`,
            description: foodTemplate.description,
            price: foodTemplate.price,
            originalPrice: (parseInt(foodTemplate.price) * 1.15).toString(),
            categoryId: this.categories.find(c => c.name === 'Food & Beverages')?.id || 3,
            storeId: store.id,
            stock: 999, // Food items typically don't have limited stock
            imageUrl: foodTemplate.image,
            images: [foodTemplate.image],
            rating: (Math.random() * 2 + 3).toFixed(1),
            totalReviews: Math.floor(Math.random() * 150) + 10,
            isActive: true,
            isFastSell: Math.random() > 0.6,
            isOnOffer: Math.random() > 0.8,
            offerPercentage: Math.random() > 0.8 ? Math.floor(Math.random() * 25) + 5 : 0,
            offerEndDate: Math.random() > 0.8 ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() : null,
            productType: "food",
            preparationTime: `${Math.floor(Math.random() * 20) + 10}-${Math.floor(Math.random() * 10) + 25} mins`,
            ingredients: foodTemplate.name.includes('Chicken') ? ['chicken', 'spices', 'onion'] : 
                        foodTemplate.name.includes('Vegetable') ? ['mixed vegetables', 'rice', 'spices'] :
                        ['traditional ingredients', 'spices'],
            allergens: foodTemplate.name.includes('dairy') ? ['dairy'] : [],
            spiceLevel: spiceLevels[Math.floor(Math.random() * spiceLevels.length)],
            isVegetarian: !foodTemplate.name.toLowerCase().includes('chicken') && !foodTemplate.name.toLowerCase().includes('mutton') && !foodTemplate.name.toLowerCase().includes('buff'),
            isVegan: foodTemplate.name.includes('Dal') || foodTemplate.name.includes('Vegetable'),
            nutritionInfo: `{"calories": ${Math.floor(Math.random() * 300) + 200}, "protein": "${Math.floor(Math.random() * 20) + 5}g"}`,
            createdAt: new Date()
          });
        }
      }
    });

    console.log(`✅ Created ${this.products.length} products across all stores`);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return this.users.find(u => u.phone === phone);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      username: user.username || null,
      email: user.email,
      password: user.password || null,
      firebaseUid: user.firebaseUid || null,
      fullName: user.fullName,
      phone: user.phone || null,
      address: user.address || null,
      city: user.city || null,
      state: user.state || null,
      role: user.role,
      status: user.status || "active",
      approvalDate: user.approvalDate || null,
      approvedBy: user.approvedBy || null,
      rejectionReason: user.rejectionReason || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    
    this.users[userIndex] = { ...this.users[userIndex], ...updates, updatedAt: new Date() };
    return this.users[userIndex];
  }

  async deleteUserAccount(userId: number): Promise<void> {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.users.splice(userIndex, 1);
    }
  }

  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.find(s => s.id === id);
  }

  async getStoresByOwnerId(ownerId: number): Promise<Store[]> {
    return this.stores.filter(s => s.ownerId === ownerId);
  }

  async getAllStores(): Promise<Store[]> {
    return this.stores;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const newStore: Store = {
      id: this.nextId++,
      name: store.name,
      slug: store.slug,
      description: store.description || null,
      ownerId: store.ownerId,
      address: store.address,
      city: store.city || null,
      state: store.state || null,
      postalCode: store.postalCode || null,
      country: store.country || null,
      latitude: store.latitude || null,
      longitude: store.longitude || null,
      phone: store.phone || null,
      website: store.website || null,
      logo: store.logo || null,
      coverImage: store.coverImage || null,
      rating: store.rating || "0.00",
      totalReviews: store.totalReviews || 0,
      featured: store.featured || false,
      isActive: store.isActive ?? true,
      storeType: store.storeType,
      cuisineType: store.cuisineType || null,
      deliveryTime: store.deliveryTime || null,
      minimumOrder: store.minimumOrder || null,
      deliveryFee: store.deliveryFee || null,
      isDeliveryAvailable: store.isDeliveryAvailable || false,
      openingHours: store.openingHours || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.stores.push(newStore);
    return newStore;
  }

  async updateStore(id: number, updates: Partial<InsertStore>): Promise<Store | undefined> {
    const storeIndex = this.stores.findIndex(s => s.id === id);
    if (storeIndex === -1) return undefined;
    
    this.stores[storeIndex] = { ...this.stores[storeIndex], ...updates, updatedAt: new Date() };
    return this.stores[storeIndex];
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return this.categories;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.find(c => c.id === id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = {
      id: this.nextId++,
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      icon: category.icon,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.categories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const categoryIndex = this.categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) return undefined;
    
    this.categories[categoryIndex] = { ...this.categories[categoryIndex], ...updates, updatedAt: new Date() };
    return this.categories[categoryIndex];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const categoryIndex = this.categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) return false;
    
    this.categories.splice(categoryIndex, 1);
    return true;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.find(p => p.id === id);
  }

  async getProductsByStoreId(storeId: number): Promise<Product[]> {
    return this.products.filter(p => p.storeId === storeId);
  }

  async getAllProducts(): Promise<Product[]> {
    return this.products;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      id: this.nextId++,
      name: product.name,
      slug: product.slug,
      description: product.description || null,
      price: product.price,
      originalPrice: product.originalPrice || null,
      categoryId: product.categoryId || null,
      storeId: product.storeId,
      stock: product.stock || 0,
      imageUrl: product.imageUrl,
      images: product.images || [],
      rating: product.rating || "0.00",
      totalReviews: product.totalReviews || 0,
      isActive: product.isActive ?? true,
      isFastSell: product.isFastSell || false,
      isOnOffer: product.isOnOffer || false,
      offerPercentage: product.offerPercentage || 0,
      offerEndDate: product.offerEndDate || null,
      productType: product.productType,
      preparationTime: product.preparationTime || null,
      ingredients: product.ingredients || [],
      allergens: product.allergens || [],
      spiceLevel: product.spiceLevel || null,
      isVegetarian: product.isVegetarian || false,
      isVegan: product.isVegan || false,
      nutritionInfo: product.nutritionInfo || null,
      createdAt: new Date()
    };
    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const productIndex = this.products.findIndex(p => p.id === id);
    if (productIndex === -1) return undefined;
    
    this.products[productIndex] = { ...this.products[productIndex], ...updates };
    return this.products[productIndex];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const productIndex = this.products.findIndex(p => p.id === id);
    if (productIndex === -1) return false;
    
    this.products.splice(productIndex, 1);
    return true;
  }

  // Placeholder implementations for other required methods
  async getPendingUsers(): Promise<User[]> { return []; }
  async approveUser(): Promise<User | undefined> { return undefined; }
  async rejectUser(): Promise<User | undefined> { return undefined; }
  async getAllUsersWithStatus(): Promise<User[]> { return this.users; }
  async getAdminUser(): Promise<any> { return undefined; }
  async getAdminUserByEmail(): Promise<any> { return undefined; }
  async createAdminUser(): Promise<any> { return undefined; }
  async getAdminUsers(): Promise<any[]> { return []; }
  async storePasswordResetToken(): Promise<void> {}
  async getPasswordResetToken(): Promise<any> { return undefined; }
  async deletePasswordResetToken(): Promise<boolean> { return false; }
  async updateUserPassword(): Promise<void> {}
  async getOrder(): Promise<any> { return undefined; }
  async getOrdersByCustomerId(): Promise<any[]> { return []; }
  async getOrdersByStoreId(): Promise<any[]> { return []; }
  async getAllOrders(): Promise<any[]> { return []; }
  async createOrder(): Promise<any> { return undefined; }
  async updateOrder(): Promise<any> { return undefined; }
  async getOrderItems(): Promise<any[]> { return []; }
  async createOrderItem(): Promise<any> { return undefined; }
  async getCartItems(): Promise<any[]> { return []; }
  async addToCart(): Promise<any> { return undefined; }
  async updateCartItem(): Promise<any> { return undefined; }
  async removeFromCart(): Promise<boolean> { return false; }
  async clearCart(): Promise<void> {}
  async getWishlistItems(): Promise<any[]> { return []; }
  async addToWishlist(): Promise<any> { return undefined; }
  async removeFromWishlist(): Promise<boolean> { return false; }
}