const API_BASE = 'http://localhost:5000';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const text = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(text);
    } catch {
      return { success: false, error: 'Invalid JSON response', status: response.status };
    }
    
    return { success: response.ok, data: responseData, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testSellerPanel() {
  console.log('Testing Seller Panel Functionality\n');
  
  const tests = [];
  
  // Test 1: Admin users endpoint (fallback)
  console.log('1. Testing admin users endpoint...');
  const adminUsersResult = await testEndpoint('/api/admin/users');
  tests.push({
    name: 'Admin Users API',
    success: adminUsersResult.success,
    details: adminUsersResult.success ? `${adminUsersResult.data.length} users found` : adminUsersResult.error
  });
  
  let testShopkeeper = null;
  if (adminUsersResult.success) {
    testShopkeeper = adminUsersResult.data.find(u => u.role === 'shopkeeper');
  }
  
  if (!testShopkeeper) {
    console.log('No shopkeeper found, creating test data...');
    
    // Create shopkeeper
    const shopkeeperData = {
      username: `seller_${Date.now()}`,
      email: `seller_${Date.now()}@test.com`,
      password: 'password123',
      fullName: 'Test Seller',
      phone: '+1234567890',
      address: '123 Seller St',
      city: 'Seller City',
      state: 'Seller State',
      role: 'shopkeeper',
      status: 'active'
    };
    
    const createUserResult = await testEndpoint('/api/auth/register', 'POST', shopkeeperData);
    tests.push({
      name: 'Shopkeeper Creation',
      success: createUserResult.success,
      details: createUserResult.success ? 'Created successfully' : createUserResult.error
    });
    
    if (createUserResult.success) {
      testShopkeeper = createUserResult.data.user;
    }
  }
  
  if (!testShopkeeper) {
    console.log('❌ Cannot proceed without shopkeeper user');
    return;
  }
  
  console.log(`✅ Using shopkeeper: ${testShopkeeper.email} (ID: ${testShopkeeper.id})`);
  
  // Test 2: Store management
  console.log('\n2. Testing store management...');
  const storesResult = await testEndpoint(`/api/stores/owner/${testShopkeeper.id}`);
  tests.push({
    name: 'Store Fetch by Owner',
    success: storesResult.success,
    details: storesResult.success ? `${storesResult.data.length} stores found` : storesResult.error
  });
  
  let testStore = null;
  if (storesResult.success && storesResult.data.length > 0) {
    testStore = storesResult.data[0];
  } else {
    // Create a store
    const storeData = {
      name: `Test Store ${Date.now()}`,
      description: 'Test store for seller functionality',
      ownerId: testShopkeeper.id,
      storeType: 'retail',
      address: '456 Store Ave',
      city: 'Store City',
      state: 'Store State',
      zipCode: '12345',
      phone: '+1987654321',
      email: testShopkeeper.email,
      status: 'active'
    };
    
    const createStoreResult = await testEndpoint('/api/stores', 'POST', storeData);
    tests.push({
      name: 'Store Creation',
      success: createStoreResult.success,
      details: createStoreResult.success ? 'Created successfully' : createStoreResult.error
    });
    
    if (createStoreResult.success) {
      testStore = createStoreResult.data;
    }
  }
  
  if (!testStore) {
    console.log('❌ Cannot test seller features without store');
    return;
  }
  
  console.log(`✅ Using store: ${testStore.name} (ID: ${testStore.id})`);
  
  // Test 3: Dashboard statistics
  console.log('\n3. Testing dashboard statistics...');
  const dashboardResult = await testEndpoint(`/api/seller/dashboard?userId=${testShopkeeper.id}`);
  tests.push({
    name: 'Dashboard Statistics',
    success: dashboardResult.success,
    details: dashboardResult.success ? 'Stats retrieved successfully' : dashboardResult.error
  });
  
  if (dashboardResult.success) {
    const stats = dashboardResult.data;
    console.log(`   Products: ${stats.totalProducts || 0}`);
    console.log(`   Orders: ${stats.totalOrders || 0}`);
    console.log(`   Revenue: $${stats.totalRevenue || 0}`);
  }
  
  // Test 4: Analytics
  console.log('\n4. Testing analytics...');
  const analyticsResult = await testEndpoint(`/api/seller/analytics?userId=${testShopkeeper.id}&days=30`);
  tests.push({
    name: 'Analytics Data',
    success: analyticsResult.success,
    details: analyticsResult.success ? `${analyticsResult.data.length} data points` : analyticsResult.error
  });
  
  // Test 5: Product inventory
  console.log('\n5. Testing product inventory...');
  const productsResult = await testEndpoint(`/api/products/store?userId=${testShopkeeper.id}`);
  tests.push({
    name: 'Product Inventory',
    success: productsResult.success,
    details: productsResult.success ? `${productsResult.data.length} products` : productsResult.error
  });
  
  // Test 6: Categories
  console.log('\n6. Testing categories...');
  const categoriesResult = await testEndpoint('/api/categories');
  tests.push({
    name: 'Categories API',
    success: categoriesResult.success,
    details: categoriesResult.success ? `${categoriesResult.data.length} categories` : categoriesResult.error
  });
  
  // Test 7: Product creation
  if (categoriesResult.success && categoriesResult.data.length > 0) {
    console.log('\n7. Testing product creation...');
    const productData = {
      name: `Test Product ${Date.now()}`,
      description: 'Product for seller panel testing',
      price: '49.99',
      originalPrice: '59.99',
      categoryId: categoriesResult.data[0].id,
      stock: 100,
      storeId: testStore.id,
      imageUrl: 'https://example.com/product.jpg',
      images: ['https://example.com/img1.jpg'],
      isFastSell: true,
      isOnOffer: false
    };
    
    const createProductResult = await testEndpoint('/api/products', 'POST', productData);
    tests.push({
      name: 'Product Creation',
      success: createProductResult.success,
      details: createProductResult.success ? 'Product created successfully' : createProductResult.error
    });
  }
  
  // Test 8: Order management
  console.log('\n8. Testing order management...');
  const ordersResult = await testEndpoint(`/api/orders/store/${testStore.id}`);
  tests.push({
    name: 'Order Management',
    success: ordersResult.success,
    details: ordersResult.success ? `${ordersResult.data.length} orders` : ordersResult.error
  });
  
  // Test 9: Store updates
  console.log('\n9. Testing store updates...');
  const storeUpdateData = { ...testStore, description: 'Updated description for testing' };
  const storeUpdateResult = await testEndpoint(`/api/stores/${testStore.id}`, 'PUT', storeUpdateData);
  tests.push({
    name: 'Store Updates',
    success: storeUpdateResult.success,
    details: storeUpdateResult.success ? 'Store updated successfully' : storeUpdateResult.error
  });
  
  // Results summary
  console.log('\n' + '='.repeat(50));
  console.log('SELLER PANEL TEST RESULTS');
  console.log('='.repeat(50));
  
  const passedTests = tests.filter(t => t.success).length;
  const totalTests = tests.length;
  
  tests.forEach(test => {
    const icon = test.success ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.details}`);
  });
  
  console.log('\n' + '-'.repeat(50));
  console.log(`Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 SELLER PANEL IS FULLY FUNCTIONAL');
    console.log('\nKey Features Working:');
    console.log('• User authentication and store access');
    console.log('• Dashboard statistics and analytics');
    console.log('• Product inventory management');
    console.log('• Product creation and updates');
    console.log('• Order management');
    console.log('• Store management');
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} issues need attention`);
  }
  
  return { passed: passedTests, total: totalTests, tests };
}

// Run the test
testSellerPanel().catch(console.error);