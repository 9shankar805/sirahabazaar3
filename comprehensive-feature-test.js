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
    storeType: 'general',
    category: 'Electronics',
    businessHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { closed: true }
    }
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
  
  // Test regular product
  const productData = {
    name: `Test Product ${Date.now()}`,
    description: 'A comprehensive test product with all features',
    price: '99.99',
    originalPrice: '149.99',
    category: 'Electronics',
    subCategory: 'Smartphones',
    brand: 'TestBrand',
    model: 'TestModel-2024',
    sku: `SKU-${Date.now()}`,
    stock: 50,
    minStock: 5,
    images: [
      'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Test+Product+1',
      'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Test+Product+2'
    ],
    specifications: {
      'Display': '6.1 inch OLED',
      'Storage': '128GB',
      'RAM': '8GB',
      'Camera': '48MP Triple Camera'
    },
    tags: ['electronics', 'smartphone', 'test'],
    isActive: true,
    isFeatured: true,
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
  
  // Test food product
  const foodProductData = {
    name: `Test Food Item ${Date.now()}`,
    description: 'A delicious test food item',
    price: '15.99',
    category: 'Food',
    subCategory: 'Main Course',
    stock: 100,
    images: ['https://via.placeholder.com/400x400/FF9500/FFFFFF?text=Test+Food'],
    productType: 'food',
    preparationTime: 25,
    ingredients: ['chicken', 'rice', 'vegetables', 'spices'],
    allergens: ['gluten'],
    spiceLevel: 'medium',
    isVegetarian: false,
    isVegan: false,
    nutritionInfo: {
      calories: 450,
      protein: '25g',
      carbs: '40g',
      fat: '15g'
    },
    storeId: testStore.id
  };
  
  const foodResult = await testAPI('/api/products', 'POST', foodProductData, authTokens.shopkeeper);
  logResult('Food Product Creation', foodResult.success);
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
    customerId: testUsers.customer.id
  };
  
  const addResult = await testAPI('/api/cart/add', 'POST', addToCartData, authTokens.customer);
  logResult('Add to Cart', addResult.success);
  
  // Get cart contents
  const cartResult = await testAPI(`/api/cart/${testUsers.customer.id}`, 'GET', null, authTokens.customer);
  logResult('Get Cart Contents', cartResult.success);
  
  if (cartResult.success && cartResult.data.length > 0) {
    console.log(`   Cart Items: ${cartResult.data.length}`);
    console.log(`   Total Quantity: ${cartResult.data.reduce((sum, item) => sum + item.quantity, 0)}`);
  }
  
  // Update cart item quantity
  if (cartResult.success && cartResult.data.length > 0) {
    const cartItem = cartResult.data[0];
    const updateResult = await testAPI('/api/cart/update', 'PATCH', {
      cartItemId: cartItem.id,
      quantity: 3
    }, authTokens.customer);
    logResult('Update Cart Quantity', updateResult.success);
  }
  
  // Test cart total calculation
  const updatedCartResult = await testAPI(`/api/cart/${testUsers.customer.id}`, 'GET', null, authTokens.customer);
  if (updatedCartResult.success) {
    const total = updatedCartResult.data.reduce((sum, item) => sum + (item.quantity * parseFloat(item.product.price)), 0);
    logResult('Cart Total Calculation', total > 0, `Total: $${total.toFixed(2)}`);
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
    customerId: testUsers.customer.id
  };
  
  const addResult = await testAPI('/api/wishlist/add', 'POST', addToWishlistData, authTokens.customer);
  logResult('Add to Wishlist', addResult.success);
  
  // Get wishlist contents
  const wishlistResult = await testAPI(`/api/wishlist/${testUsers.customer.id}`, 'GET', null, authTokens.customer);
  logResult('Get Wishlist Contents', wishlistResult.success);
  
  if (wishlistResult.success && wishlistResult.data.length > 0) {
    console.log(`   Wishlist Items: ${wishlistResult.data.length}`);
    console.log(`   Product: ${wishlistResult.data[0].product.name}`);
  }
  
  // Remove item from wishlist
  const removeResult = await testAPI('/api/wishlist/remove', 'DELETE', {
    productId: testProduct.id,
    customerId: testUsers.customer.id
  }, authTokens.customer);
  logResult('Remove from Wishlist', removeResult.success);
  
  // Verify removal
  const verifyResult = await testAPI(`/api/wishlist/${testUsers.customer.id}`, 'GET', null, authTokens.customer);
  logResult('Verify Wishlist Removal', verifyResult.success && verifyResult.data.length === 0);
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
    review: 'Excellent product! Highly recommended for testing purposes.',
    title: 'Great Test Product'
  };
  
  const ratingResult = await testAPI('/api/reviews', 'POST', ratingData, authTokens.customer);
  logResult('Add Product Rating', ratingResult.success);
  
  // Get product reviews
  const reviewsResult = await testAPI(`/api/reviews/product/${testProduct.id}`, 'GET');
  logResult('Get Product Reviews', reviewsResult.success);
  
  if (reviewsResult.success && reviewsResult.data.length > 0) {
    const avgRating = reviewsResult.data.reduce((sum, review) => sum + review.rating, 0) / reviewsResult.data.length;
    console.log(`   Total Reviews: ${reviewsResult.data.length}`);
    console.log(`   Average Rating: ${avgRating.toFixed(1)}/5`);
    console.log(`   Latest Review: "${reviewsResult.data[0].review}"`);
  }
  
  // Test rating filtering
  const highRatingsResult = await testAPI(`/api/reviews/product/${testProduct.id}?minRating=4`, 'GET');
  logResult('Filter High Ratings', highRatingsResult.success);
  
  // Update rating
  if (ratingResult.success) {
    const updateRatingResult = await testAPI(`/api/reviews/${ratingResult.data.id}`, 'PATCH', {
      rating: 4,
      review: 'Updated review: Still a great product, but slightly lowered rating for testing.',
      title: 'Updated Test Review'
    }, authTokens.customer);
    logResult('Update Product Rating', updateRatingResult.success);
  }
}

// 7. Test Product Search and Filtering
async function testProductSearchAndFiltering() {
  console.log('\n🔍 Testing Product Search & Filtering');
  console.log('======================================');
  
  // Search products by name
  const searchResult = await testAPI('/api/products/search?q=test', 'GET');
  logResult('Product Search by Name', searchResult.success);
  
  if (searchResult.success) {
    console.log(`   Search Results: ${searchResult.data.length} products found`);
  }
  
  // Filter by category
  const categoryResult = await testAPI('/api/products?category=Electronics', 'GET');
  logResult('Filter by Category', categoryResult.success);
  
  // Filter by price range
  const priceResult = await testAPI('/api/products?minPrice=50&maxPrice=200', 'GET');
  logResult('Filter by Price Range', priceResult.success);
  
  // Filter by rating
  const ratingFilterResult = await testAPI('/api/products?minRating=4', 'GET');
  logResult('Filter by Rating', ratingFilterResult.success);
  
  // Combined filters
  const combinedResult = await testAPI('/api/products?category=Electronics&minPrice=50&maxPrice=200&minRating=4', 'GET');
  logResult('Combined Filters', combinedResult.success);
}

// 8. Test Product Variations and Options
async function testProductVariations() {
  console.log('\n🎨 Testing Product Variations');
  console.log('==============================');
  
  if (!testStore) {
    logResult('Product Variations', false, 'No test store available');
    return;
  }
  
  // Create product with variations
  const variationProductData = {
    name: `Variable Test Product ${Date.now()}`,
    description: 'Product with color and size variations',
    price: '29.99',
    category: 'Clothing',
    subCategory: 'T-Shirts',
    stock: 100,
    images: ['https://via.placeholder.com/400x400/3498DB/FFFFFF?text=Variable+Product'],
    productType: 'retail',
    storeId: testStore.id,
    variations: [
      {
        name: 'Color',
        options: ['Red', 'Blue', 'Green', 'Black']
      },
      {
        name: 'Size',
        options: ['S', 'M', 'L', 'XL']
      }
    ],
    variationCombinations: [
      { attributes: { Color: 'Red', Size: 'M' }, price: '29.99', stock: 10, sku: 'VAR-RED-M' },
      { attributes: { Color: 'Blue', Size: 'L' }, price: '31.99', stock: 8, sku: 'VAR-BLUE-L' },
      { attributes: { Color: 'Green', Size: 'S' }, price: '27.99', stock: 12, sku: 'VAR-GREEN-S' }
    ]
  };
  
  const variationResult = await testAPI('/api/products', 'POST', variationProductData, authTokens.shopkeeper);
  logResult('Product with Variations', variationResult.success);
  
  if (variationResult.success) {
    console.log(`   Variations: ${variationResult.data.variations?.length || 0}`);
    console.log(`   Combinations: ${variationResult.data.variationCombinations?.length || 0}`);
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
    await testProductSearchAndFiltering();
    await testProductVariations();
    
    console.log('\n🎉 All Tests Completed!');
    console.log('========================');
    console.log(`Test completed at: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    console.error('\n💥 Test Suite Error:', error);
  }
}

// Run the tests
runComprehensiveTests().catch(console.error);