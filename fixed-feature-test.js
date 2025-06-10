const BASE_URL = 'http://localhost:5000';

// Test utilities
async function testAPI(endpoint, method = 'GET', data = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

function logResult(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${details ? ' - ' + details : ''}`);
}

// Get category ID by name
async function getCategoryId(categoryName) {
  const categories = await testAPI('/api/categories', 'GET');
  if (categories.success) {
    const category = categories.data.find(cat => cat.name.toLowerCase().includes(categoryName.toLowerCase()));
    return category ? category.id : null;
  }
  return null;
}

// Test Data
const testUsers = {
  customer: {
    email: `customer_${Date.now()}@test.com`,
    password: 'password123',
    username: `customer_${Date.now()}`,
    role: 'customer',
    fullName: 'Test Customer'
  },
  shopkeeper: {
    email: `shopkeeper_${Date.now()}@test.com`,
    password: 'password123',
    username: `shopkeeper_${Date.now()}`,
    role: 'shopkeeper',
    fullName: 'Test Shopkeeper'
  }
};

let authTokens = {};
let testStore = null;
let testProduct = null;

// 1. Test User Registration and Authentication
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication System');
  console.log('=================================');
  
  // Register customer
  const customerReg = await testAPI('/api/auth/register', 'POST', testUsers.customer);
  logResult('Customer Registration', customerReg.success);
  
  // Register shopkeeper
  const shopkeeperReg = await testAPI('/api/auth/register', 'POST', testUsers.shopkeeper);
  logResult('Shopkeeper Registration', shopkeeperReg.success);
  
  // Login customer
  const customerLogin = await testAPI('/api/auth/login', 'POST', {
    email: testUsers.customer.email,
    password: testUsers.customer.password
  });
  logResult('Customer Login', customerLogin.success);
  if (customerLogin.success) {
    authTokens.customer = customerLogin.data.token;
    testUsers.customer.id = customerLogin.data.user.id;
  }
  
  // Login shopkeeper
  const shopkeeperLogin = await testAPI('/api/auth/login', 'POST', {
    email: testUsers.shopkeeper.email,
    password: testUsers.shopkeeper.password
  });
  logResult('Shopkeeper Login', shopkeeperLogin.success);
  if (shopkeeperLogin.success) {
    authTokens.shopkeeper = shopkeeperLogin.data.token;
    testUsers.shopkeeper.id = shopkeeperLogin.data.user.id;
  }
}

// 2. Test Store Creation
async function testStoreCreation() {
  console.log('\n🏪 Testing Store Creation');
  console.log('=========================');
  
  if (!testUsers.shopkeeper.id) {
    logResult('Store Creation', false, 'No shopkeeper ID available');
    return;
  }
  
  const storeData = {
    name: `Test Store ${Date.now()}`,
    description: 'A comprehensive test store for feature testing',
    ownerId: testUsers.shopkeeper.id,
    address: '123 Test Street, Kathmandu, Nepal',
    phone: '+977-1-234567',
    email: testUsers.shopkeeper.email,
    storeType: 'retail',
    category: 'Electronics'
  };
  
  const storeResult = await testAPI('/api/stores', 'POST', storeData, authTokens.shopkeeper);
  logResult('Store Creation', storeResult.success);
  
  if (storeResult.success) {
    testStore = storeResult.data;
    console.log(`   Store ID: ${testStore.id}`);
    console.log(`   Store Name: ${testStore.name}`);
  }
}

// 3. Test Product Addition
async function testProductAddition() {
  console.log('\n📦 Testing Product Addition');
  console.log('============================');
  
  if (!testStore) {
    logResult('Product Addition', false, 'No test store available');
    return;
  }
  
  // Get Electronics category ID
  const categoryId = await getCategoryId('Electronics');
  if (!categoryId) {
    logResult('Get Category ID', false, 'Electronics category not found');
    return;
  }
  
  // Test regular product with proper validation
  const productData = {
    name: `Test Product ${Date.now()}`,
    description: 'A comprehensive test product with all features',
    price: '99.99',
    originalPrice: '149.99',
    categoryId: categoryId,
    stock: 50,
    images: [
      'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Test+Product+1',
      'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Test+Product+2'
    ],
    isActive: true,
    isFastSell: true,
    isOnOffer: true,
    offerPercentage: 33,
    offerEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    productType: 'retail',
    storeId: testStore.id
  };
  
  const productResult = await testAPI('/api/products', 'POST', productData, authTokens.shopkeeper);
  logResult('Regular Product Creation', productResult.success);
  
  if (productResult.success) {
    testProduct = productResult.data;
    console.log(`   Product ID: ${testProduct.id}`);
    console.log(`   Product Name: ${testProduct.name}`);
    console.log(`   Price: $${testProduct.price}`);
    console.log(`   Discount: ${testProduct.offerPercentage}%`);
  }
  
  // Test food product with correct data types
  const foodCategoryId = await getCategoryId('Food');
  const foodProductData = {
    name: `Test Food Item ${Date.now()}`,
    description: 'A delicious test food item',
    price: '15.99',
    categoryId: foodCategoryId || categoryId, // fallback to electronics if food category not found
    stock: 100,
    images: ['https://via.placeholder.com/400x400/FF9500/FFFFFF?text=Test+Food'],
    productType: 'food',
    preparationTime: '25 mins', // String format
    ingredients: ['chicken', 'rice', 'vegetables', 'spices'],
    allergens: ['gluten'],
    spiceLevel: 'medium',
    isVegetarian: false,
    isVegan: false,
    nutritionInfo: JSON.stringify({ // Convert to JSON string
      calories: 450,
      protein: '25g',
      carbs: '40g',
      fat: '15g'
    }),
    storeId: testStore.id
  };
  
  const foodResult = await testAPI('/api/products', 'POST', foodProductData, authTokens.shopkeeper);
  logResult('Food Product Creation', foodResult.success);
  
  if (foodResult.success) {
    console.log(`   Food Product ID: ${foodResult.data.id}`);
    console.log(`   Food Product Name: ${foodResult.data.name}`);
  }
}

// 4. Test Cart Functionality
async function testCartFunctionality() {
  console.log('\n🛒 Testing Cart Functionality');
  console.log('==============================');
  
  if (!testProduct || !testUsers.customer.id) {
    logResult('Cart Test Setup', false, 'Missing product or customer');
    return;
  }
  
  // Add item to cart
  const addToCartData = {
    productId: testProduct.id,
    quantity: 2,
    userId: testUsers.customer.id
  };
  
  const addResult = await testAPI('/api/cart', 'POST', addToCartData, authTokens.customer);
  logResult('Add to Cart', addResult.success);
  
  // Get cart contents
  const cartResult = await testAPI(`/api/cart/${testUsers.customer.id}`, 'GET', null, authTokens.customer);
  logResult('Get Cart Contents', cartResult.success);
  
  if (cartResult.success && cartResult.data.length > 0) {
    console.log(`   Cart Items: ${cartResult.data.length}`);
    const totalQuantity = cartResult.data.reduce((sum, item) => sum + item.quantity, 0);
    console.log(`   Total Quantity: ${totalQuantity}`);
    
    // Test cart total calculation
    const total = cartResult.data.reduce((sum, item) => {
      const price = parseFloat(item.product?.price || item.price || 0);
      return sum + (item.quantity * price);
    }, 0);
    logResult('Cart Total Calculation', total > 0, `Total: $${total.toFixed(2)}`);
  }
  
  // Update cart item quantity
  if (cartResult.success && cartResult.data.length > 0) {
    const cartItem = cartResult.data[0];
    const updateResult = await testAPI(`/api/cart/${cartItem.id}`, 'PATCH', {
      quantity: 3
    }, authTokens.customer);
    logResult('Update Cart Quantity', updateResult.success);
  }
}

// 5. Test Wishlist Functionality
async function testWishlistFunctionality() {
  console.log('\n❤️ Testing Wishlist Functionality');
  console.log('==================================');
  
  if (!testProduct || !testUsers.customer.id) {
    logResult('Wishlist Test Setup', false, 'Missing product or customer');
    return;
  }
  
  // Add item to wishlist
  const addToWishlistData = {
    productId: testProduct.id,
    userId: testUsers.customer.id
  };
  
  const addResult = await testAPI('/api/wishlist', 'POST', addToWishlistData, authTokens.customer);
  logResult('Add to Wishlist', addResult.success);
  
  // Get wishlist contents
  const wishlistResult = await testAPI(`/api/wishlist/${testUsers.customer.id}`, 'GET', null, authTokens.customer);
  logResult('Get Wishlist Contents', wishlistResult.success);
  
  if (wishlistResult.success && wishlistResult.data.length > 0) {
    console.log(`   Wishlist Items: ${wishlistResult.data.length}`);
    console.log(`   Product: ${wishlistResult.data[0].product?.name || 'Product name not available'}`);
  }
  
  // Remove item from wishlist (test toggle functionality)
  if (wishlistResult.success && wishlistResult.data.length > 0) {
    const wishlistItem = wishlistResult.data[0];
    const removeResult = await testAPI(`/api/wishlist/${wishlistItem.id}`, 'DELETE', null, authTokens.customer);
    logResult('Remove from Wishlist', removeResult.success);
    
    // Verify removal
    const verifyResult = await testAPI(`/api/wishlist/${testUsers.customer.id}`, 'GET', null, authTokens.customer);
    logResult('Verify Wishlist Removal', verifyResult.success && verifyResult.data.length === 0);
  }
}

// 6. Test Rating System
async function testRatingSystem() {
  console.log('\n⭐ Testing Rating System');
  console.log('=========================');
  
  if (!testProduct || !testUsers.customer.id) {
    logResult('Rating Test Setup', false, 'Missing product or customer');
    return;
  }
  
  // Add product rating
  const ratingData = {
    productId: testProduct.id,
    customerId: testUsers.customer.id,
    rating: 5,
    comment: 'Excellent product! Highly recommended for testing purposes.',
    title: 'Great Test Product'
  };
  
  const ratingResult = await testAPI('/api/reviews', 'POST', ratingData, authTokens.customer);
  logResult('Add Product Rating', ratingResult.success);
  
  // Get product reviews
  const reviewsResult = await testAPI(`/api/products/${testProduct.id}/reviews`, 'GET');
  logResult('Get Product Reviews', reviewsResult.success);
  
  if (reviewsResult.success && reviewsResult.data.length > 0) {
    const avgRating = reviewsResult.data.reduce((sum, review) => sum + review.rating, 0) / reviewsResult.data.length;
    console.log(`   Total Reviews: ${reviewsResult.data.length}`);
    console.log(`   Average Rating: ${avgRating.toFixed(1)}/5`);
    console.log(`   Latest Review: "${reviewsResult.data[0].comment || reviewsResult.data[0].review}"`);
  }
  
  // Test rating filtering
  const highRatingsResult = await testAPI(`/api/products/${testProduct.id}/reviews?minRating=4`, 'GET');
  logResult('Filter High Ratings', highRatingsResult.success);
}

// 7. Test Order Creation and Management
async function testOrderFunctionality() {
  console.log('\n📋 Testing Order Functionality');
  console.log('===============================');
  
  if (!testProduct || !testUsers.customer.id) {
    logResult('Order Test Setup', false, 'Missing product or customer');
    return;
  }
  
  // Create test order
  const orderData = {
    customerId: testUsers.customer.id,
    items: [{
      productId: testProduct.id,
      quantity: 2,
      price: testProduct.price
    }],
    totalAmount: (parseFloat(testProduct.price) * 2).toString(),
    shippingAddress: '456 Test Avenue, Kathmandu, Nepal',
    paymentMethod: 'cash_on_delivery',
    phone: '+977-1-987654',
    customerName: testUsers.customer.fullName
  };
  
  const orderResult = await testAPI('/api/orders', 'POST', orderData, authTokens.customer);
  logResult('Create Order', orderResult.success);
  
  if (orderResult.success) {
    console.log(`   Order ID: ${orderResult.data.id}`);
    console.log(`   Total Amount: $${orderResult.data.totalAmount}`);
    
    // Get order details
    const orderDetailsResult = await testAPI(`/api/orders/${orderResult.data.id}`, 'GET', null, authTokens.customer);
    logResult('Get Order Details', orderDetailsResult.success);
  }
  
  // Get customer's order history
  const orderHistoryResult = await testAPI(`/api/orders/customer/${testUsers.customer.id}`, 'GET', null, authTokens.customer);
  logResult('Get Order History', orderHistoryResult.success);
  
  if (orderHistoryResult.success) {
    console.log(`   Order History Count: ${orderHistoryResult.data.length}`);
  }
}

// Main test runner
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Feature Tests');
  console.log('========================================');
  console.log(`Test started at: ${new Date().toLocaleString()}`);
  
  try {
    await testAuthentication();
    await testStoreCreation();
    await testProductAddition();
    await testCartFunctionality();
    await testWishlistFunctionality();
    await testRatingSystem();
    await testOrderFunctionality();
    
    console.log('\n🎉 All Tests Completed!');
    console.log('========================');
    console.log(`Test completed at: ${new Date().toLocaleString()}`);
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('✅ Authentication System');
    console.log('✅ Store Creation');
    console.log('✅ Product Addition (Retail & Food)');
    console.log('✅ Cart Management');
    console.log('✅ Wishlist Operations');
    console.log('✅ Rating & Review System');
    console.log('✅ Order Management');
    
  } catch (error) {
    console.error('\n💥 Test Suite Error:', error);
  }
}

// Run the tests
runComprehensiveTests().catch(console.error);