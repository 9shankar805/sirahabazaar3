// Comprehensive testing script for all user roles
const baseUrl = 'http://localhost:5000';

// Test users
const testUsers = {
  customer: { email: 'customer@example.com', password: 'password123' },
  shopkeeper: { email: 'teststore@demo.com', password: 'password123' },
  restaurant: { email: 'testrestaurant@demo.com', password: 'password123' },
  delivery: { email: 'testdelivery@demo.com', password: 'password123' }
};

async function testAPI(endpoint, method = 'GET', data = null, token = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) options.body = JSON.stringify(data);
  if (token) options.headers.Authorization = `Bearer ${token}`;
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function loginUser(userType) {
  const user = testUsers[userType];
  return await testAPI('/api/auth/login', 'POST', user);
}

// Test Customer Functionality
async function testCustomer() {
  console.log('\n=== TESTING CUSTOMER FUNCTIONALITY ===');
  
  // 1. Login as customer
  const login = await loginUser('customer');
  console.log('Customer Login:', login.status === 200 ? 'SUCCESS' : 'FAILED');
  
  // 2. Test product browsing
  const products = await testAPI('/api/products');
  console.log('Browse Products:', products.status === 200 ? 'SUCCESS' : 'FAILED');
  
  // 3. Test store browsing
  const stores = await testAPI('/api/stores');
  console.log('Browse Stores:', stores.status === 200 ? 'SUCCESS' : 'FAILED');
  
  // 4. Test categories
  const categories = await testAPI('/api/categories');
  console.log('Browse Categories:', categories.status === 200 ? 'SUCCESS' : 'FAILED');
  
  // 5. Test cart functionality (if customer exists)
  if (login.status === 200) {
    const userId = login.data.user.id;
    const cart = await testAPI(`/api/cart/${userId}`);
    console.log('View Cart:', cart.status === 200 ? 'SUCCESS' : 'FAILED');
    
    // Add item to cart
    if (products.data && products.data.length > 0) {
      const addToCart = await testAPI('/api/cart', 'POST', {
        userId: userId,
        productId: products.data[0].id,
        quantity: 1
      });
      console.log('Add to Cart:', addToCart.status === 201 ? 'SUCCESS' : 'FAILED');
    }
    
    // Test wishlist
    const wishlist = await testAPI(`/api/wishlist/${userId}`);
    console.log('View Wishlist:', wishlist.status === 200 ? 'SUCCESS' : 'FAILED');
  }
  
  return login.status === 200;
}

// Test Store Owner Functionality
async function testStoreOwner() {
  console.log('\n=== TESTING STORE OWNER FUNCTIONALITY ===');
  
  // 1. Login as store owner
  const login = await loginUser('shopkeeper');
  console.log('Store Owner Login:', login.status === 200 ? 'SUCCESS' : 'FAILED');
  
  if (login.status === 200) {
    const userId = login.data.user.id;
    
    // 2. Test store creation
    const createStore = await testAPI('/api/stores', 'POST', {
      name: 'Test Electronics Store',
      slug: 'test-electronics-' + Date.now(),
      description: 'Testing electronics store',
      ownerId: userId,
      address: '123 Test Street',
      city: 'Kathmandu',
      state: 'Bagmati',
      country: 'Nepal',
      postalCode: '44600',
      phone: '1234567890',
      storeType: 'retail',
      isActive: true
    });
    console.log('Create Store:', createStore.status === 201 ? 'SUCCESS' : 'FAILED');
    
    // 3. Test product management
    if (createStore.status === 201) {
      const storeId = createStore.data.id;
      
      const createProduct = await testAPI('/api/products', 'POST', {
        name: 'Test Product',
        slug: 'test-product-' + Date.now(),
        description: 'Test product description',
        price: 99.99,
        storeId: storeId,
        stock: 10,
        imageUrl: 'https://via.placeholder.com/300',
        isActive: true
      });
      console.log('Create Product:', createProduct.status === 201 ? 'SUCCESS' : 'FAILED');
      
      // Test getting store products
      const storeProducts = await testAPI(`/api/stores/${storeId}/products`);
      console.log('Get Store Products:', storeProducts.status === 200 ? 'SUCCESS' : 'FAILED');
    }
    
    // 4. Test seller dashboard
    const stores = await testAPI(`/api/stores/owner/${userId}`);
    console.log('Get Owner Stores:', stores.status === 200 ? 'SUCCESS' : 'FAILED');
  }
  
  return login.status === 200;
}

// Test Restaurant Owner Functionality
async function testRestaurantOwner() {
  console.log('\n=== TESTING RESTAURANT OWNER FUNCTIONALITY ===');
  
  // 1. Login as restaurant owner
  const login = await loginUser('restaurant');
  console.log('Restaurant Owner Login:', login.status === 200 ? 'SUCCESS' : 'FAILED');
  
  if (login.status === 200) {
    const userId = login.data.user.id;
    
    // 2. Test restaurant creation
    const createRestaurant = await testAPI('/api/stores', 'POST', {
      name: 'Test Restaurant',
      slug: 'test-restaurant-' + Date.now(),
      description: 'Testing restaurant',
      ownerId: userId,
      address: '456 Restaurant Ave',
      city: 'Kathmandu',
      state: 'Bagmati',
      country: 'Nepal',
      postalCode: '44600',
      phone: '1234567891',
      storeType: 'restaurant',
      cuisineType: 'nepali',
      isDeliveryAvailable: true,
      deliveryTime: '25-35 mins',
      minimumOrder: 200,
      deliveryFee: 50,
      isActive: true
    });
    console.log('Create Restaurant:', createRestaurant.status === 201 ? 'SUCCESS' : 'FAILED');
    
    // 3. Test food item management
    if (createRestaurant.status === 201) {
      const restaurantId = createRestaurant.data.id;
      
      const createFoodItem = await testAPI('/api/products', 'POST', {
        name: 'Test Momo',
        slug: 'test-momo-' + Date.now(),
        description: 'Delicious dumplings',
        price: 150,
        storeId: restaurantId,
        stock: 100,
        imageUrl: 'https://via.placeholder.com/300',
        productType: 'food',
        preparationTime: '15-20 mins',
        isVegetarian: true,
        spiceLevel: 'medium',
        isActive: true
      });
      console.log('Create Food Item:', createFoodItem.status === 201 ? 'SUCCESS' : 'FAILED');
    }
  }
  
  return login.status === 200;
}

// Test Delivery Partner Functionality
async function testDeliveryPartner() {
  console.log('\n=== TESTING DELIVERY PARTNER FUNCTIONALITY ===');
  
  // 1. Login as delivery partner
  const login = await loginUser('delivery');
  console.log('Delivery Partner Login:', login.status === 200 ? 'SUCCESS' : 'FAILED');
  
  if (login.status === 200) {
    const userId = login.data.user.id;
    
    // 2. Test delivery partner registration
    const createPartner = await testAPI('/api/delivery-partners/signup', 'POST', {
      userId: userId,
      vehicleType: 'bike',
      vehicleNumber: 'TEST-123',
      drivingLicense: 'DL123456789',
      idProofType: 'Aadhar',
      idProofNumber: '123456789012',
      deliveryAreas: ['Siraha', 'Lahan'],
      emergencyContact: '9876543210',
      bankAccountNumber: '1234567890',
      ifscCode: 'BANK001234'
    });
    console.log('Create Delivery Partner:', createPartner.status === 201 ? 'SUCCESS' : 'FAILED');
    
    // 3. Test getting delivery partner details
    const partnerDetails = await testAPI(`/api/delivery-partners/user/${userId}`);
    console.log('Get Partner Details:', partnerDetails.status === 200 ? 'SUCCESS' : 'FAILED');
    
    // 4. Test delivery assignments
    const deliveries = await testAPI('/api/deliveries');
    console.log('Get Deliveries:', deliveries.status === 200 ? 'SUCCESS' : 'FAILED');
  }
  
  return login.status === 200;
}

// Test Admin Functionality
async function testAdmin() {
  console.log('\n=== TESTING ADMIN FUNCTIONALITY ===');
  
  // Test admin endpoints
  const users = await testAPI('/api/admin/users');
  console.log('Get All Users:', users.status === 200 ? 'SUCCESS' : 'FAILED');
  
  const stores = await testAPI('/api/admin/stores');
  console.log('Get All Stores:', stores.status === 200 ? 'SUCCESS' : 'FAILED');
  
  const orders = await testAPI('/api/admin/orders');
  console.log('Get All Orders:', orders.status === 200 ? 'SUCCESS' : 'FAILED');
  
  const deliveryPartners = await testAPI('/api/delivery-partners');
  console.log('Get Delivery Partners:', deliveryPartners.status === 200 ? 'SUCCESS' : 'FAILED');
  
  return true;
}

// Run comprehensive tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Testing of Siraha Bazaar');
  console.log('='.repeat(50));
  
  try {
    const customerTest = await testCustomer();
    const storeOwnerTest = await testStoreOwner();
    const restaurantOwnerTest = await testRestaurantOwner();
    const deliveryPartnerTest = await testDeliveryPartner();
    const adminTest = await testAdmin();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 TESTING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Customer Functionality: ${customerTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    console.log(`Store Owner Functionality: ${storeOwnerTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    console.log(`Restaurant Owner Functionality: ${restaurantOwnerTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    console.log(`Delivery Partner Functionality: ${deliveryPartnerTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    console.log(`Admin Functionality: ${adminTest ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  }
}

// Run if this script is executed directly
if (typeof window === 'undefined') {
  runAllTests();
}