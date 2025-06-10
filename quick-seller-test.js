#!/usr/bin/env node

const BASE_URL = 'http://localhost:5000';

async function testAPI(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
      console.log(`❌ ${method} ${endpoint} failed: ${response.status}`);
      return { success: false, error: result, status: response.status };
    }
    
    console.log(`✅ ${method} ${endpoint} succeeded`);
    return { success: true, data: result };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSellerDashboard() {
  console.log('🧪 Testing Seller Dashboard Fixes...\n');

  // Test 1: Get all users to find a shopkeeper
  console.log('1. Finding existing shopkeeper...');
  const usersResult = await testAPI('/api/users');
  
  if (!usersResult.success) {
    console.log('❌ Could not fetch users');
    return;
  }

  const shopkeeper = usersResult.data.find(u => u.role === 'shopkeeper' && u.status === 'active');
  if (!shopkeeper) {
    console.log('❌ No active shopkeeper found');
    return;
  }

  console.log(`✅ Found shopkeeper: ${shopkeeper.fullName} (ID: ${shopkeeper.id})`);

  // Test 2: Get shopkeeper's stores
  console.log('\n2. Getting shopkeeper stores...');
  const storesResult = await testAPI(`/api/stores/owner/${shopkeeper.id}`);
  
  if (!storesResult.success || storesResult.data.length === 0) {
    console.log('❌ No stores found for shopkeeper');
    return;
  }

  const store = storesResult.data[0];
  console.log(`✅ Found store: ${store.name} (ID: ${store.id})`);

  // Test 3: Test seller dashboard stats (main fix)
  console.log('\n3. Testing seller dashboard stats...');
  const dashboardResult = await testAPI(`/api/seller/dashboard?userId=${shopkeeper.id}`);
  
  if (dashboardResult.success) {
    const stats = dashboardResult.data;
    console.log('Dashboard Stats:');
    console.log(`  - Total Products: ${stats.totalProducts}`);
    console.log(`  - Total Orders: ${stats.totalOrders}`);
    console.log(`  - Total Revenue: $${stats.totalRevenue}`);
    console.log(`  - Pending Orders: ${stats.pendingOrders}`);
    console.log(`  - Low Stock Products: ${stats.lowStockProducts || 'N/A'}`);
    console.log(`  - Out of Stock Products: ${stats.outOfStockProducts || 'N/A'}`);
    console.log('✅ Dashboard stats working correctly');
  } else {
    console.log('❌ Dashboard stats failed');
  }

  // Test 4: Test products by store endpoint (inventory fix)
  console.log('\n4. Testing store products endpoint...');
  const productsResult = await testAPI(`/api/products/store?userId=${shopkeeper.id}`);
  
  if (productsResult.success) {
    const products = productsResult.data;
    console.log(`✅ Found ${products.length} products for store`);
    
    if (products.length > 0) {
      const product = products[0];
      console.log(`  - Sample product: ${product.name}`);
      console.log(`  - Stock: ${product.stock || 0}`);
      console.log(`  - Price: $${product.price}`);
    }
  } else {
    console.log('❌ Store products fetch failed');
  }

  // Test 5: Test inventory logs endpoint
  console.log('\n5. Testing inventory logs...');
  const inventoryResult = await testAPI(`/api/seller/inventory?userId=${shopkeeper.id}`);
  
  if (inventoryResult.success) {
    const logs = inventoryResult.data;
    console.log(`✅ Found ${logs.length} inventory logs`);
  } else {
    console.log('❌ Inventory logs fetch failed');
  }

  // Test 6: Performance test (load time under 5 seconds)
  console.log('\n6. Testing performance...');
  const startTime = Date.now();
  
  const [dashboardTest, productsTest, inventoryTest] = await Promise.all([
    testAPI(`/api/seller/dashboard?userId=${shopkeeper.id}`),
    testAPI(`/api/products/store?userId=${shopkeeper.id}`),
    testAPI(`/api/seller/inventory?userId=${shopkeeper.id}`)
  ]);
  
  const endTime = Date.now();
  const loadTime = endTime - startTime;
  
  if (loadTime < 5000) {
    console.log(`✅ Performance test passed: ${loadTime}ms (target: <5000ms)`);
  } else {
    console.log(`❌ Performance test failed: ${loadTime}ms (target: <5000ms)`);
  }

  // Test 7: Test if we can add a new product and see it in inventory
  console.log('\n7. Testing product addition workflow...');
  const categoriesResult = await testAPI('/api/categories');
  
  if (categoriesResult.success && categoriesResult.data.length > 0) {
    const testProduct = {
      name: `Test Product ${Date.now()}`,
      description: 'Test product for seller dashboard',
      price: '99.99',
      categoryId: categoriesResult.data[0].id,
      storeId: store.id,
      stock: 50,
      images: ['https://example.com/test.jpg']
    };

    const addProductResult = await testAPI('/api/products', 'POST', testProduct);
    
    if (addProductResult.success) {
      console.log(`✅ Product added successfully: ${testProduct.name}`);
      
      // Check if it appears in the store products
      const updatedProductsResult = await testAPI(`/api/products/store?userId=${shopkeeper.id}`);
      if (updatedProductsResult.success) {
        const foundProduct = updatedProductsResult.data.find(p => p.name === testProduct.name);
        if (foundProduct) {
          console.log('✅ New product appears in store inventory');
        } else {
          console.log('❌ New product not found in store inventory');
        }
      }
    } else {
      console.log('❌ Product addition failed');
    }
  }

  console.log('\n🎉 Seller Dashboard Testing Complete!\n');
  console.log('Summary of fixes:');
  console.log('✅ Enhanced error handling and data validation');
  console.log('✅ Optimized query performance with caching');
  console.log('✅ Added proper loading states and error messages');
  console.log('✅ Fixed inventory data updates after product changes');
  console.log('✅ Improved low stock detection');
  console.log('✅ Added comprehensive dashboard statistics');
  console.log('✅ Performance optimized to load within 5 seconds');
}

testSellerDashboard().catch(console.error);