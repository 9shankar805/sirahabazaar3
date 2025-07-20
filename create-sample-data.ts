#!/usr/bin/env tsx

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

// Sample data arrays
const locations = [
  { city: "Siraha", latitude: "26.6603", longitude: "86.2064" },
  { city: "Lahan", latitude: "26.7201", longitude: "86.4928" },
  { city: "Mirchaiya", latitude: "26.7815", longitude: "86.4926" },
  { city: "Golbazar", latitude: "26.7542", longitude: "86.5028" }
];

const retailStores = [
  "Siraha Electronics Hub", "Fashion Palace Lahan", "Mirchaiya Book Store", "Golbazar Pharmacy",
  "Siraha Sports Center", "Lahan Mobile Shop", "Mirchaiya Grocery Store", "Golbazar Hardware Store",
  "Siraha Beauty Parlor", "Lahan Textile House", "Mirchaiya Computer Center", "Golbazar Gift Shop",
  "Siraha Furniture Mart", "Lahan Shoe Store", "Mirchaiya Stationary Hub", "Golbazar Auto Parts",
  "Siraha Kitchenware Store", "Lahan Music Center", "Mirchaiya Toy Store", "Golbazar Watch Shop"
];

const restaurants = [
  "Siraha Spice Kitchen", "Lahan Momo Palace", "Mirchaiya Biryani House", "Golbazar Chinese Corner",
  "Siraha Pizza Hub", "Lahan Burger Joint", "Mirchaiya Thali House", "Golbazar BBQ Grill",
  "Siraha Sweet House", "Lahan Coffee House", "Mirchaiya Seafood Palace", "Golbazar Vegan Delight",
  "Siraha Chowmein Center", "Lahan Tiffin Service", "Mirchaiya Ice Cream Parlor", "Golbazar Sandwich Shop",
  "Siraha Traditional Kitchen", "Lahan Juice Bar", "Mirchaiya Breakfast Corner", "Golbazar Night Diner"
];

async function createUsers() {
  console.log("Creating sample users...");
  const users = [];
  
  // Create retail store owners
  for (let i = 0; i < 20; i++) {
    const location = locations[i % locations.length];
    const userData = {
      fullName: `${retailStores[i]} Owner`,
      email: `retail${i + 1}@siraha.com`,
      phone: `+977-98${String(i + 1).padStart(8, '0')}`,
      password: 'password123',
      confirmPassword: 'password123',
      role: 'shopkeeper',
      address: `${location.city} Main Market`
    };
    
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        const user = await response.json();
        users.push(user);
        console.log(`✓ Created retail user: ${userData.fullName}`);
      } else {
        console.log(`⚠ User ${userData.email} may already exist`);
      }
    } catch (error) {
      console.error(`✗ Error creating user ${userData.fullName}:`, error);
    }
  }
  
  // Create restaurant owners
  for (let i = 0; i < 20; i++) {
    const location = locations[i % locations.length];
    const userData = {
      fullName: `${restaurants[i]} Owner`,
      email: `restaurant${i + 1}@siraha.com`,
      phone: `+977-97${String(i + 1).padStart(8, '0')}`,
      password: 'password123',
      confirmPassword: 'password123',
      role: 'shopkeeper',
      address: `${location.city} Food Street`
    };
    
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        const user = await response.json();
        users.push(user);
        console.log(`✓ Created restaurant user: ${userData.fullName}`);
      } else {
        console.log(`⚠ User ${userData.email} may already exist`);
      }
    } catch (error) {
      console.error(`✗ Error creating user ${userData.fullName}:`, error);
    }
  }
  
  return users;
}

async function createStores() {
  console.log("Creating sample stores...");
  
  // Create retail stores
  for (let i = 0; i < 20; i++) {
    const location = locations[i % locations.length];
    const storeData = {
      name: retailStores[i],
      description: `Quality ${retailStores[i].split(' ').pop()} products and services in ${location.city}`,
      address: `${location.city} Main Market, Ward ${i + 1}`,
      latitude: location.latitude,
      longitude: location.longitude,
      phone: `+977-98${String(i + 1).padStart(8, '0')}`,
      website: `https://${retailStores[i].toLowerCase().replace(/\s+/g, '')}.com`,
      storeType: 'retail',
      isDeliveryAvailable: Math.random() > 0.3
    };
    
    try {
      // Login as the store owner first
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `retail${i + 1}@siraha.com`,
          password: 'password123'
        })
      });
      
      if (loginResponse.ok) {
        const storeResponse = await fetch(`${API_BASE}/stores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData)
        });
        
        if (storeResponse.ok) {
          console.log(`✓ Created retail store: ${storeData.name}`);
        } else {
          console.log(`⚠ Store ${storeData.name} may already exist`);
        }
      }
    } catch (error) {
      console.error(`✗ Error creating store ${storeData.name}:`, error);
    }
  }
  
  // Create restaurants
  for (let i = 0; i < 20; i++) {
    const location = locations[i % locations.length];
    const cuisineTypes = ['Nepali', 'Indian', 'Chinese', 'Italian', 'Fast Food', 'Continental'];
    const storeData = {
      name: restaurants[i],
      description: `Delicious food and dining experience in ${location.city}`,
      address: `${location.city} Food Street, Block ${i + 1}`,
      latitude: location.latitude,
      longitude: location.longitude,
      phone: `+977-97${String(i + 1).padStart(8, '0')}`,
      website: `https://${restaurants[i].toLowerCase().replace(/\s+/g, '')}.com`,
      storeType: 'restaurant',
      cuisineType: cuisineTypes[i % cuisineTypes.length],
      deliveryTime: `${20 + (i % 3) * 10}-${30 + (i % 3) * 10} mins`,
      minimumOrder: String(100 + (i % 5) * 50),
      deliveryFee: String(30 + (i % 4) * 20),
      isDeliveryAvailable: true
    };
    
    try {
      // Login as the restaurant owner first
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `restaurant${i + 1}@siraha.com`,
          password: 'password123'
        })
      });
      
      if (loginResponse.ok) {
        const storeResponse = await fetch(`${API_BASE}/stores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData)
        });
        
        if (storeResponse.ok) {
          console.log(`✓ Created restaurant: ${storeData.name}`);
        } else {
          console.log(`⚠ Restaurant ${storeData.name} may already exist`);
        }
      }
    } catch (error) {
      console.error(`✗ Error creating restaurant ${storeData.name}:`, error);
    }
  }
}

async function createCategories() {
  console.log("Creating sample categories...");
  
  const categories = [
    { name: "Electronics", icon: "smartphone" },
    { name: "Fashion", icon: "shirt" },
    { name: "Books", icon: "book" },
    { name: "Health", icon: "heart" },
    { name: "Sports", icon: "dumbbell" },
    { name: "Grocery", icon: "shopping-basket" },
    { name: "Hardware", icon: "wrench" },
    { name: "Beauty", icon: "sparkles" },
    { name: "Food & Beverages", icon: "utensils" },
    { name: "Home & Garden", icon: "home" }
  ];
  
  for (const category of categories) {
    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      
      if (response.ok) {
        console.log(`✓ Created category: ${category.name}`);
      } else {
        console.log(`⚠ Category ${category.name} may already exist`);
      }
    } catch (error) {
      console.error(`✗ Error creating category ${category.name}:`, error);
    }
  }
}

async function main() {
  console.log("🌟 Starting sample data creation for Siraha Bazaar...");
  console.log("📍 Creating data for locations: Siraha, Lahan, Mirchaiya, Golbazar");
  
  try {
    await createCategories();
    await createUsers();
    await createStores();
    
    console.log("\n✅ Sample data creation completed!");
    console.log("📊 Summary:");
    console.log("- 40 Users created (20 retail + 20 restaurant owners)");
    console.log("- 20 Retail stores created");
    console.log("- 20 Restaurants created");
    console.log("- 10 Categories created");
    console.log("- Data distributed across Siraha, Lahan, Mirchaiya, and Golbazar");
    
  } catch (error) {
    console.error("❌ Error during data creation:", error);
  }
}

// Wait for server to be ready
setTimeout(() => {
  main().catch(console.error);
}, 3000);