#!/usr/bin/env node

// Test store creation and product addition functionality
const baseURL = 'http://localhost:5000';

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${baseURL}${endpoint}`, config);
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

async function testStoreCreationWorkflow() {
  console.log('🏪 Testing Store Creation and Product Addition Workflow');
  console.log('=====================================================');
  
  // Generate unique user data
  const timestamp = Date.now();
  const testUser = {
    email: `newstore${timestamp}@test.com`,
    password: 'password123',
    username: `newstore${timestamp}`,
    role: 'shopkeeper',
    fullName: 'Test Store Owner'
  };
  
  // 1. Register new shopkeeper
  console.log('\n1. Registering new shopkeeper...');
  const registration = await testAPI('/api/auth/register', 'POST', testUser);
  console.log(`Registration: ${registration.success ? 'SUCCESS' : 'FAILED'}`);
  if (!registration.success) {
    console.log('Error:', registration.data.error);
    return;
  }
  
  // 2. Login as shopkeeper
  console.log('\n2. Logging in as shopkeeper...');
  const login = await testAPI('/api/auth/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  console.log(`Login: ${login.success ? 'SUCCESS' : 'FAILED'}`);
  if (!login.success) {
    console.log('Error:', login.data.error);
    return;
  }
  
  const userId = login.data.user.id;
  console.log(`User ID: ${userId}`);
  console.log(`User Status: ${login.data.user.status}`);
  
  // 3. Create store
  console.log('\n3. Creating store...');
  const storeData = {
    name: `Test Store ${timestamp}`,
    description: 'A test store for verification',
    ownerId: userId,
    address: '123 Test Street, Kathmandu, Nepal',
    latitude: '27.7172',
    longitude: '85.3240',
    phone: '+977-9841234567',
    website: 'https://teststore.com',
    storeType: 'retail',
    isActive: true
  };
  
  const storeCreation = await testAPI('/api/stores', 'POST', storeData);
  console.log(`Store Creation: ${storeCreation.success ? 'SUCCESS' : 'FAILED'}`);
  if (!storeCreation.success) {
    console.log('Error:', storeCreation.data.error);
    if (storeCreation.data.details) {
      console.log('Details:', storeCreation.data.details);
    }
    return;
  }
  
  const storeId = storeCreation.data.id;
  console.log(`Store ID: ${storeId}`);
  console.log(`Store Name: ${storeCreation.data.name}`);
  
  // 4. Add product to store
  console.log('\n4. Adding product to store...');
  const productData = {
    name: `Test Product ${timestamp}`,
    description: 'A test product for verification',
    price: '99.99',
    originalPrice: '149.99',
    stock: 50,
    storeId: storeId,
    categoryId: 3, // Electronics category
    images: ['https://via.placeholder.com/400x400?text=Test+Product'],
    productType: 'retail',
    isActive: true
  };
  
  const productCreation = await testAPI('/api/products', 'POST', productData);
  console.log(`Product Creation: ${productCreation.success ? 'SUCCESS' : 'FAILED'}`);
  if (!productCreation.success) {
    console.log('Error:', productCreation.data.error);
    if (productCreation.data.details) {
      console.log('Details:', productCreation.data.details);
    }
    return;
  }
  
  const productId = productCreation.data.id;
  console.log(`Product ID: ${productId}`);
  console.log(`Product Name: ${productCreation.data.name}`);
  console.log(`Product Price: Rs.${productCreation.data.price}`);
  
  // 5. Verify store products
  console.log('\n5. Verifying store products...');
  const storeProducts = await testAPI(`/api/products/store/${storeId}`);
  console.log(`Get Store Products: ${storeProducts.success ? 'SUCCESS' : 'FAILED'}`);
  if (storeProducts.success) {
    console.log(`Products in store: ${storeProducts.data.length}`);
  }
  
  // 6. Test restaurant store type
  console.log('\n6. Testing restaurant store creation...');
  const restaurantUser = {
    email: `restaurant${timestamp}@test.com`,
    password: 'password123',
    username: `restaurant${timestamp}`,
    role: 'shopkeeper',
    fullName: 'Test Restaurant Owner'
  };
  
  const restaurantReg = await testAPI('/api/auth/register', 'POST', restaurantUser);
  if (restaurantReg.success) {
    const restaurantLogin = await testAPI('/api/auth/login', 'POST', {
      email: restaurantUser.email,
      password: restaurantUser.password
    });
    
    if (restaurantLogin.success) {
      const restaurantData = {
        name: `Test Restaurant ${timestamp}`,
        description: 'A test restaurant for verification',
        ownerId: restaurantLogin.data.user.id,
        address: '456 Food Street, Kathmandu, Nepal',
        latitude: '27.7172',
        longitude: '85.3240',
        phone: '+977-9841234568',
        storeType: 'restaurant',
        cuisineType: 'Nepali',
        deliveryTime: '30-45 minutes',
        minimumOrder: '200',
        isDeliveryAvailable: true,
        isActive: true
      };
      
      const restaurantCreation = await testAPI('/api/stores', 'POST', restaurantData);
      console.log(`Restaurant Creation: ${restaurantCreation.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (restaurantCreation.success) {
        // Add food item
        const foodData = {
          name: `Momo Special ${timestamp}`,
          description: 'Delicious steamed dumplings',
          price: '250.00',
          stock: 100,
          storeId: restaurantCreation.data.id,
          categoryId: 4, // Food category if exists, otherwise 3
          productType: 'food',
          preparationTime: '20 minutes',
          ingredients: ['flour', 'chicken', 'onion', 'spices'],
          spiceLevel: 'medium',
          isVegetarian: false,
          isActive: true
        };
        
        const foodCreation = await testAPI('/api/products', 'POST', foodData);
        console.log(`Food Item Creation: ${foodCreation.success ? 'SUCCESS' : 'FAILED'}`);
      }
    }
  }
  
  console.log('\n✅ Store Creation and Product Addition Test Complete');
  console.log('=====================================================');
}

// Run the test
testStoreCreationWorkflow().catch(console.error);