import { db } from "./server/db";
import * as schema from "./shared/schema";
import bcrypt from "bcrypt";

async function populateEssentialData() {
  console.log("🎯 Populating Neon database with essential Siraha Bazaar data...\n");
  
  try {
    // 1. Create default admin users
    console.log("👤 Creating admin users...");
    
    const adminPassword = await bcrypt.hash("admin123", 10);
    const superAdminPassword = await bcrypt.hash("super123", 10);
    
    await db.insert(schema.adminUsers).values([
      {
        email: "admin@sirahbazaar.com",
        password: adminPassword,
        fullName: "Admin User",
        role: "admin"
      },
      {
        email: "superadmin@sirahbazaar.com", 
        password: superAdminPassword,
        fullName: "Super Admin",
        role: "super_admin"
      }
    ]).onConflictDoNothing();
    
    // 2. Create default categories
    console.log("📂 Creating default categories...");
    
    await db.insert(schema.categories).values([
      { name: "Electronics", slug: "electronics", description: "Electronic devices and gadgets", icon: "smartphone" },
      { name: "Fashion", slug: "fashion", description: "Clothing and accessories", icon: "shirt" },
      { name: "Grocery", slug: "grocery", description: "Food and everyday essentials", icon: "shopping-cart" },
      { name: "Home & Garden", slug: "home-garden", description: "Home decor and gardening", icon: "home" },
      { name: "Sports", slug: "sports", description: "Sports equipment and accessories", icon: "dumbbell" },
      { name: "Books", slug: "books", description: "Books and educational materials", icon: "book" },
      { name: "Food & Beverage", slug: "food-beverage", description: "Restaurant food and drinks", icon: "utensils" },
      { name: "Health & Beauty", slug: "health-beauty", description: "Health and beauty products", icon: "heart" }
    ]).onConflictDoNothing();
    
    // 3. Create sample users (customers and shopkeepers)
    console.log("👥 Creating sample users...");
    
    const customerPassword = await bcrypt.hash("customer123", 10);
    const shopkeeperPassword = await bcrypt.hash("shop123", 10);
    
    await db.insert(schema.users).values([
      {
        username: "john_customer",
        email: "john@customer.com",
        password: customerPassword,
        fullName: "John Customer",
        phone: "+977-9876543210",
        address: "Siraha Municipality",
        city: "Siraha",
        state: "Province 2",
        role: "customer",
        status: "active"
      },
      {
        username: "family_restaurant",
        email: "owner@familyrestaurant.com",
        password: shopkeeperPassword,
        fullName: "Ram Bahadur Shrestha",
        phone: "+977-9876543211",
        address: "Main Street, Siraha",
        city: "Siraha", 
        state: "Province 2",
        role: "shopkeeper",
        status: "approved"
      },
      {
        username: "siraha_electronics",
        email: "owner@sirahaelectronics.com",
        password: shopkeeperPassword,
        fullName: "Sita Kumari Sharma",
        phone: "+977-9876543212",
        address: "Electronics Market, Siraha",
        city: "Siraha",
        state: "Province 2", 
        role: "shopkeeper",
        status: "approved"
      },
      {
        username: "lahan_grocery",
        email: "owner@lahangrocery.com",
        password: shopkeeperPassword,
        fullName: "Krishna Prasad Yadav",
        phone: "+977-9876543213",
        address: "Central Market, Lahan",
        city: "Lahan",
        state: "Province 2",
        role: "shopkeeper", 
        status: "approved"
      }
    ]).onConflictDoNothing();
    
    // Get user IDs for reference
    const users = await db.select().from(schema.users);
    const familyRestaurantOwner = users.find(u => u.username === "family_restaurant");
    const electronicsOwner = users.find(u => u.username === "siraha_electronics");
    const groceryOwner = users.find(u => u.username === "lahan_grocery");
    
    // 4. Create stores 
    console.log("🏪 Creating stores...");
    
    if (familyRestaurantOwner && electronicsOwner && groceryOwner) {
      await db.insert(schema.stores).values([
        {
          name: "Family Restaurant",
          slug: "family-restaurant-siraha",
          description: "Authentic Nepali and Indian cuisine served fresh daily",
          ownerId: familyRestaurantOwner.id,
          address: "Main Street, Ward 5, Siraha Municipality",
          city: "Siraha",
          state: "Province 2",
          country: "Nepal",
          latitude: "26.6602",
          longitude: "86.2070",
          phone: "+977-9876543211",
          storeType: "restaurant",
          cuisineType: "nepali-indian",
          deliveryTime: "25-35 mins",
          minimumOrder: "300.00",
          deliveryFee: "50.00",
          isDeliveryAvailable: true,
          rating: "4.5",
          totalReviews: 128,
          featured: true,
          isActive: true
        },
        {
          name: "Siraha Electronics Center",
          slug: "siraha-electronics-center", 
          description: "Latest electronics, mobile phones, and accessories",
          ownerId: electronicsOwner.id,
          address: "Electronics Market, Ward 3, Siraha Municipality",
          city: "Siraha",
          state: "Province 2",
          country: "Nepal",
          latitude: "26.6615",
          longitude: "86.2085",
          phone: "+977-9876543212",
          storeType: "retail",
          deliveryFee: "40.00",
          isDeliveryAvailable: true,
          rating: "4.2",
          totalReviews: 89,
          featured: true,
          isActive: true
        },
        {
          name: "Lahan Grocery Store",
          slug: "lahan-grocery-store",
          description: "Fresh groceries, vegetables, and daily essentials",
          ownerId: groceryOwner.id,
          address: "Central Market, Ward 2, Lahan Municipality",
          city: "Lahan",
          state: "Province 2", 
          country: "Nepal",
          latitude: "26.7191",
          longitude: "86.0951",
          phone: "+977-9876543213",
          storeType: "retail",
          deliveryFee: "30.00",
          isDeliveryAvailable: true,
          rating: "4.3",
          totalReviews: 67,
          isActive: true
        }
      ]).onConflictDoNothing();
    }
    
    // Get category and store IDs
    const categories = await db.select().from(schema.categories);
    const stores = await db.select().from(schema.stores);
    
    const foodCat = categories.find(c => c.slug === "food-beverage");
    const electronicsCat = categories.find(c => c.slug === "electronics");
    const groceryCat = categories.find(c => c.slug === "grocery");
    
    const familyRestaurant = stores.find(s => s.slug === "family-restaurant-siraha");
    const electronicsStore = stores.find(s => s.slug === "siraha-electronics-center");
    const groceryStore = stores.find(s => s.slug === "lahan-grocery-store");
    
    // 5. Create sample products
    console.log("🛍️ Creating sample products...");
    
    if (foodCat && electronicsCat && groceryCat && familyRestaurant && electronicsStore && groceryStore) {
      await db.insert(schema.products).values([
        // Family Restaurant Products
        {
          name: "Dal Bhat Set",
          slug: "dal-bhat-set-family",
          description: "Traditional Nepali meal with dal, bhat, vegetables, and pickle",
          price: "350.00",
          originalPrice: "400.00",
          categoryId: foodCat.id,
          storeId: familyRestaurant.id,
          stock: 50,
          imageUrl: "https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Dal+Bhat",
          rating: "4.6",
          totalReviews: 45,
          productType: "food",
          preparationTime: "15-20 mins",
          ingredients: ["Rice", "Lentils", "Vegetables", "Spices"],
          isVegetarian: true,
          spiceLevel: "mild",
          isOnOffer: true,
          offerPercentage: 12,
          isActive: true
        },
        {
          name: "Chicken Momo (10 pcs)",
          slug: "chicken-momo-family",
          description: "Steamed chicken dumplings served with spicy tomato chutney",
          price: "280.00",
          categoryId: foodCat.id,
          storeId: familyRestaurant.id,
          stock: 30,
          imageUrl: "https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Chicken+Momo",
          rating: "4.8",
          totalReviews: 67,
          productType: "food",
          preparationTime: "20-25 mins",
          ingredients: ["Chicken", "Flour", "Spices", "Vegetables"],
          spiceLevel: "medium",
          isActive: true
        },
        // Electronics Store Products  
        {
          name: "Samsung Galaxy A54",
          slug: "samsung-galaxy-a54",
          description: "Latest Samsung smartphone with excellent camera and performance",
          price: "45000.00",
          originalPrice: "48000.00",
          categoryId: electronicsCat.id,
          storeId: electronicsStore.id,
          stock: 15,
          imageUrl: "https://via.placeholder.com/400x300/34495E/FFFFFF?text=Galaxy+A54",
          rating: "4.4",
          totalReviews: 23,
          isOnOffer: true,
          offerPercentage: 6,
          isActive: true
        },
        {
          name: "Wireless Bluetooth Headphones",
          slug: "wireless-bluetooth-headphones",
          description: "High-quality wireless headphones with noise cancellation",
          price: "3500.00",
          categoryId: electronicsCat.id,
          storeId: electronicsStore.id,
          stock: 25,
          imageUrl: "https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Headphones",
          rating: "4.1",
          totalReviews: 18,
          isActive: true
        },
        // Grocery Store Products
        {
          name: "Organic Basmati Rice (5kg)",
          slug: "organic-basmati-rice-5kg",
          description: "Premium quality organic basmati rice, perfect for daily meals",
          price: "750.00",
          categoryId: groceryCat.id,
          storeId: groceryStore.id,
          stock: 40,
          imageUrl: "https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Basmati+Rice",
          rating: "4.5",
          totalReviews: 34,
          isActive: true
        },
        {
          name: "Fresh Vegetables Mix (1kg)",
          slug: "fresh-vegetables-mix",
          description: "Assorted fresh seasonal vegetables including potato, onion, tomato",
          price: "120.00",
          categoryId: groceryCat.id,
          storeId: groceryStore.id,
          stock: 60,
          imageUrl: "https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Vegetables",
          rating: "4.3",
          totalReviews: 28,
          isActive: true
        }
      ]).onConflictDoNothing();
    }
    
    // 6. Create delivery zones
    console.log("🚚 Creating delivery zones...");
    
    await db.insert(schema.deliveryZones).values([
      {
        name: "Siraha Local (0-5km)",
        minDistance: "0.0",
        maxDistance: "5.0", 
        baseFee: "30.00",
        perKmRate: "8.00",
        isActive: true
      },
      {
        name: "Siraha Extended (5-15km)",
        minDistance: "5.0",
        maxDistance: "15.0",
        baseFee: "50.00", 
        perKmRate: "12.00",
        isActive: true
      },
      {
        name: "Inter-City (15-50km)",
        minDistance: "15.0",
        maxDistance: "50.0",
        baseFee: "80.00",
        perKmRate: "15.00",
        isActive: true
      }
    ]).onConflictDoNothing();
    
    console.log("✅ Database population completed successfully!");
    
    // Show summary
    const userCount = await db.select().from(schema.users);
    const storeCount = await db.select().from(schema.stores);
    const productCount = await db.select().from(schema.products);
    const categoryCount = await db.select().from(schema.categories);
    
    console.log("\n📊 DATABASE SUMMARY:");
    console.log(`   👥 Users: ${userCount.length}`);
    console.log(`   🏪 Stores: ${storeCount.length}`);  
    console.log(`   🛍️ Products: ${productCount.length}`);
    console.log(`   📂 Categories: ${categoryCount.length}`);
    
  } catch (error: any) {
    console.error("❌ Error populating database:", error.message);
    throw error;
  }
}

// Run population script
populateEssentialData()
  .then(() => {
    console.log("\n🎉 Siraha Bazaar database is ready!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Population failed:", error.message);
    process.exit(1);
  });