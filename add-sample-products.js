#!/usr/bin/env node

import { Pool } from 'pg';

// Connect to Neon database
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_B14cMjkFUhuw@ep-wispy-paper-a1eejnp5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false }
});

const retailProducts = [
  // Electronics
  { name: "Samsung Galaxy A54 5G", price: 45000, category: "Electronics", description: "Latest 5G smartphone with excellent camera", image: "https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Galaxy+A54" },
  { name: "Apple iPhone 14", price: 125000, category: "Electronics", description: "Premium iPhone with advanced features", image: "https://via.placeholder.com/400x300/007AFF/FFFFFF?text=iPhone+14" },
  { name: "OnePlus Nord CE 3", price: 35000, category: "Electronics", description: "Mid-range smartphone with flagship features", image: "https://via.placeholder.com/400x300/1DB584/FFFFFF?text=OnePlus+Nord" },
  { name: "Wireless Bluetooth Headphones", price: 3500, category: "Electronics", description: "High-quality wireless headphones", image: "https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Headphones" },
  { name: "Smart TV 43 inch", price: 65000, category: "Electronics", description: "4K Smart TV with streaming apps", image: "https://via.placeholder.com/400x300/2C3E50/FFFFFF?text=Smart+TV" },

  // Fashion
  { name: "Cotton T-Shirt", price: 850, category: "Fashion", description: "Comfortable cotton t-shirt for daily wear", image: "https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=T-Shirt" },
  { name: "Jeans Pant", price: 2500, category: "Fashion", description: "Premium quality denim jeans", image: "https://via.placeholder.com/400x300/34495E/FFFFFF?text=Jeans" },
  { name: "Formal Shirt", price: 1800, category: "Fashion", description: "Professional formal shirt for office", image: "https://via.placeholder.com/400x300/1ABC9C/FFFFFF?text=Formal+Shirt" },
  { name: "Sports Shoes", price: 4200, category: "Fashion", description: "Comfortable sports shoes for running", image: "https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Sports+Shoes" },
  { name: "Winter Jacket", price: 6500, category: "Fashion", description: "Warm winter jacket for cold weather", image: "https://via.placeholder.com/400x300/8E44AD/FFFFFF?text=Winter+Jacket" },

  // Books
  { name: "Programming with Python", price: 1200, category: "Books", description: "Learn Python programming from basics", image: "https://via.placeholder.com/400x300/3498DB/FFFFFF?text=Python+Book" },
  { name: "Nepali Literature", price: 850, category: "Books", description: "Classic Nepali literature collection", image: "https://via.placeholder.com/400x300/E67E22/FFFFFF?text=Nepali+Books" },
  { name: "Math Textbook Class 10", price: 650, category: "Books", description: "Mathematics textbook for Class 10", image: "https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Math+Book" },

  // Health & Beauty
  { name: "Face Cream", price: 1250, category: "Beauty", description: "Moisturizing face cream for all skin types", image: "https://via.placeholder.com/400x300/F1C40F/FFFFFF?text=Face+Cream" },
  { name: "Shampoo 400ml", price: 650, category: "Beauty", description: "Hair care shampoo for healthy hair", image: "https://via.placeholder.com/400x300/16A085/FFFFFF?text=Shampoo" },
  { name: "Vitamin C Tablets", price: 850, category: "Health", description: "Essential vitamin C supplement", image: "https://via.placeholder.com/400x300/E8F5E8/000000?text=Vitamin+C" },

  // Grocery
  { name: "Basmati Rice 5kg", price: 750, category: "Grocery", description: "Premium quality basmati rice", image: "https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Basmati+Rice" },
  { name: "Cooking Oil 1L", price: 285, category: "Grocery", description: "Pure cooking oil for healthy cooking", image: "https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Cooking+Oil" },
  { name: "Tea Leaves 500g", price: 450, category: "Grocery", description: "Premium quality tea leaves", image: "https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Tea+Leaves" },
  { name: "Sugar 1kg", price: 120, category: "Grocery", description: "Pure white sugar", image: "https://via.placeholder.com/400x300/FFFFFF/000000?text=Sugar" },

  // Sports
  { name: "Football", price: 1850, category: "Sports", description: "Professional quality football", image: "https://via.placeholder.com/400x300/000000/FFFFFF?text=Football" },
  { name: "Cricket Bat", price: 3200, category: "Sports", description: "English willow cricket bat", image: "https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Cricket+Bat" },
  { name: "Yoga Mat", price: 1250, category: "Sports", description: "Non-slip yoga mat for exercise", image: "https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Yoga+Mat" }
];

const foodProducts = [
  // Nepali Cuisine
  { name: "Dal Bhat Set", price: 350, description: "Traditional Nepali meal with dal, bhat, vegetables", category: "Food & Beverages", prep_time: "15-20 mins", spice_level: "mild", vegetarian: true },
  { name: "Chicken Momo (10 pcs)", price: 280, description: "Steamed chicken dumplings with chutney", category: "Food & Beverages", prep_time: "20-25 mins", spice_level: "medium", vegetarian: false },
  { name: "Veg Momo (10 pcs)", price: 220, description: "Steamed vegetable dumplings", category: "Food & Beverages", prep_time: "18-22 mins", spice_level: "mild", vegetarian: true },
  { name: "Newari Khaja Set", price: 450, description: "Traditional Newari snack platter", category: "Food & Beverages", prep_time: "25-30 mins", spice_level: "medium", vegetarian: false },

  // Indian Cuisine
  { name: "Chicken Biryani", price: 420, description: "Aromatic basmati rice with spiced chicken", category: "Food & Beverages", prep_time: "30-35 mins", spice_level: "hot", vegetarian: false },
  { name: "Veg Biryani", price: 320, description: "Fragrant vegetable biryani", category: "Food & Beverages", prep_time: "25-30 mins", spice_level: "medium", vegetarian: true },
  { name: "Butter Chicken", price: 380, description: "Creamy tomato-based chicken curry", category: "Food & Beverages", prep_time: "25-30 mins", spice_level: "mild", vegetarian: false },
  { name: "Paneer Butter Masala", price: 320, description: "Rich and creamy paneer curry", category: "Food & Beverages", prep_time: "20-25 mins", spice_level: "mild", vegetarian: true },

  // Chinese Cuisine
  { name: "Chicken Chowmein", price: 250, description: "Stir-fried noodles with chicken and vegetables", category: "Food & Beverages", prep_time: "15-20 mins", spice_level: "medium", vegetarian: false },
  { name: "Veg Chowmein", price: 200, description: "Vegetable stir-fried noodles", category: "Food & Beverages", prep_time: "12-18 mins", spice_level: "mild", vegetarian: true },
  { name: "Chicken Fried Rice", price: 280, description: "Wok-fried rice with chicken and egg", category: "Food & Beverages", prep_time: "15-20 mins", spice_level: "mild", vegetarian: false },
  { name: "Sweet and Sour Chicken", price: 350, description: "Crispy chicken in sweet and sour sauce", category: "Food & Beverages", prep_time: "20-25 mins", spice_level: "mild", vegetarian: false },

  // Fast Food
  { name: "Chicken Burger", price: 320, description: "Juicy chicken burger with fries", category: "Food & Beverages", prep_time: "12-15 mins", spice_level: "mild", vegetarian: false },
  { name: "Veg Burger", price: 250, description: "Healthy vegetable burger", category: "Food & Beverages", prep_time: "10-12 mins", spice_level: "mild", vegetarian: true },
  { name: "Chicken Pizza (Medium)", price: 650, description: "Delicious chicken pizza with cheese", category: "Food & Beverages", prep_time: "20-25 mins", spice_level: "mild", vegetarian: false },
  { name: "Margherita Pizza (Medium)", price: 480, description: "Classic cheese and tomato pizza", category: "Food & Beverages", prep_time: "18-22 mins", spice_level: "mild", vegetarian: true },

  // Beverages & Desserts
  { name: "Lassi", price: 120, description: "Traditional yogurt drink", category: "Food & Beverages", prep_time: "5 mins", spice_level: "none", vegetarian: true },
  { name: "Fresh Fruit Juice", price: 150, description: "Seasonal fresh fruit juice", category: "Food & Beverages", prep_time: "5 mins", spice_level: "none", vegetarian: true },
  { name: "Ice Cream (2 Scoops)", price: 180, description: "Creamy ice cream in various flavors", category: "Food & Beverages", prep_time: "2 mins", spice_level: "none", vegetarian: true },
  { name: "Kheer", price: 150, description: "Traditional rice pudding dessert", category: "Food & Beverages", prep_time: "10 mins", spice_level: "none", vegetarian: true }
];

function generateSlug(name) {
  return name.toLowerCase()
    .replace(/[^\w\s-]/g, '') 
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function addProductsToStores() {
  const client = await pool.connect();
  
  try {
    console.log("🛍️ Adding sample products to stores...");
    
    // Get all stores and categories
    const storesResult = await client.query('SELECT * FROM stores ORDER BY id');
    const categoriesResult = await client.query('SELECT * FROM categories ORDER BY id');
    
    const stores = storesResult.rows;
    const categories = categoriesResult.rows;
    
    console.log(`Found ${stores.length} stores and ${categories.length} categories`);
    
    let totalProductsAdded = 0;
    
    // Add retail products to retail stores
    const retailStores = stores.filter(store => store.store_type === 'retail');
    console.log(`\n📦 Adding retail products to ${retailStores.length} retail stores...`);
    
    for (const store of retailStores) {
      // Add 3-5 random retail products per store
      const productsToAdd = Math.floor(Math.random() * 3) + 3;
      const shuffledProducts = [...retailProducts].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < productsToAdd && i < shuffledProducts.length; i++) {
        const product = shuffledProducts[i];
        const category = categories.find(c => c.name === product.category);
        
        if (category) {
          const slug = generateSlug(`${product.name}-${store.id}`);
          
          try {
            await client.query(`
              INSERT INTO products (name, slug, description, price, category_id, store_id, stock, image_url, is_active)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
              ON CONFLICT (slug) DO NOTHING
            `, [
              product.name,
              slug,
              product.description,
              product.price.toString(),
              category.id,
              store.id,
              Math.floor(Math.random() * 50) + 10, // Random stock 10-60
              product.image
            ]);
            
            totalProductsAdded++;
          } catch (err) {
            console.error(`Error adding product ${product.name} to ${store.name}:`, err.message);
          }
        }
      }
      
      console.log(`   ✓ Added products to ${store.name}`);
    }
    
    // Add food products to restaurants
    const restaurants = stores.filter(store => store.store_type === 'restaurant');
    console.log(`\n🍽️ Adding food products to ${restaurants.length} restaurants...`);
    
    const foodCategory = categories.find(c => c.name === 'Food & Beverages');
    
    for (const restaurant of restaurants) {
      // Add 5-8 random food products per restaurant
      const productsToAdd = Math.floor(Math.random() * 4) + 5;
      const shuffledFood = [...foodProducts].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < productsToAdd && i < shuffledFood.length; i++) {
        const product = shuffledFood[i];
        const slug = generateSlug(`${product.name}-${restaurant.id}`);
        
        try {
          await client.query(`
            INSERT INTO products (
              name, slug, description, price, category_id, store_id, stock, 
              image_url, product_type, preparation_time, spice_level, 
              is_vegetarian, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'food', $9, $10, $11, true)
            ON CONFLICT (slug) DO NOTHING
          `, [
            product.name,
            slug,
            product.description,
            product.price.toString(),
            foodCategory ? foodCategory.id : null,
            restaurant.id,
            100, // Food items always in stock
            `https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=${encodeURIComponent(product.name)}`,
            product.prep_time,
            product.spice_level,
            product.vegetarian
          ]);
          
          totalProductsAdded++;
        } catch (err) {
          console.error(`Error adding food product ${product.name} to ${restaurant.name}:`, err.message);
        }
      }
      
      console.log(`   ✓ Added food items to ${restaurant.name}`);
    }
    
    console.log(`\n✅ Successfully added ${totalProductsAdded} products to the database!`);
    
    // Show final summary
    const finalProductCount = await client.query('SELECT COUNT(*) FROM products');
    const finalStoreCount = await client.query('SELECT COUNT(*) FROM stores');
    const finalUserCount = await client.query('SELECT COUNT(*) FROM users');
    
    console.log("\n📊 FINAL DATABASE SUMMARY:");
    console.log(`   👥 Users: ${finalUserCount.rows[0].count}`);
    console.log(`   🏪 Stores: ${finalStoreCount.rows[0].count}`);
    console.log(`   🛍️ Products: ${finalProductCount.rows[0].count}`);
    console.log("   🌍 Locations: Siraha, Lahan, Mirchaiya, Golbazar (Nepal)");
    
  } catch (error) {
    console.error("❌ Error adding products:", error.message);
  } finally {
    client.release();
  }
}

addProductsToStores()
  .then(() => {
    console.log("\n🎉 Product population completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Product population failed:", error.message);
    process.exit(1);
  });