const BASE_URL = 'http://localhost:5000';

// Test configuration and state
let testState = {
  adminUser: null,
  adminToken: null,
  customer: null,
  customerToken: null,
  deliveryPartner: null,
  deliveryPartnerToken: null,
  store: null,
  product: null,
  order: null,
  delivery: null
};

// Utility functions
async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
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

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data: result
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

function logResult(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Test functions
async function createAdminUser() {
  console.log('\n=== STEP 0: Create Admin User ===');
  
  const timestamp = Date.now();
  const adminEmail = `admin${timestamp}@test.com`;
  
  const response = await makeRequest('/api/admin/register', 'POST', {
    email: adminEmail,
    password: 'admin123',
    fullName: 'Test Admin User',
    role: 'admin'
  });

  if (response.ok) {
    logResult('Admin User Creation', true, `Created admin: ${adminEmail}`);
    return { email: adminEmail, password: 'admin123' };
  } else {
    logResult('Admin User Creation', false, response.data?.error || 'Failed to create admin');
    // Try with existing admin credentials
    return { email: 'admin@sirahaBazaar.com', password: 'admin123' };
  }
}

async function testAdminLogin() {
  console.log('\n=== STEP 1: Admin Login ===');
  
  // First try to create admin user
  const adminCreds = await createAdminUser();
  
  const response = await makeRequest('/api/admin/login', 'POST', adminCreds);
  
  if (response.ok && response.data.admin) {
    testState.adminUser = response.data.admin;
    testState.adminToken = response.data.token;
    logResult('Admin Login', true, `Logged in as ${testState.adminUser.fullName}`);
    return true;
  }
  
  // Try alternative credentials
  const altCredentials = [
    { email: 'admin@admin.com', password: 'admin123' },
    { email: 'test@admin.com', password: 'password123' }
  ];

  for (const creds of altCredentials) {
    const altResponse = await makeRequest('/api/admin/login', 'POST', creds);
    
    if (altResponse.ok && altResponse.data.admin) {
      testState.adminUser = altResponse.data.admin;
      testState.adminToken = altResponse.data.token;
      logResult('Admin Login', true, `Logged in as ${testState.adminUser.fullName}`);
      return true;
    }
  }
  
  logResult('Admin Login', false, 'All admin credentials failed');
  return false;
}

async function testDeliveryPartnerRegistration() {
  console.log('\n=== STEP 2: Delivery Partner Registration ===');
  
  // Generate unique email to avoid conflicts
  const timestamp = Date.now();
  const uniqueEmail = `delivery${timestamp}@test.com`;
  const uniquePhone = `987654${timestamp.toString().slice(-4)}`;
  
  // First create user account
  const userResponse = await makeRequest('/api/auth/register', 'POST', {
    fullName: 'Test Delivery Partner',
    email: uniqueEmail,
    password: 'password123',
    phone: uniquePhone,
    address: 'Test Address, Siraha',
    role: 'delivery_partner'
  });

  if (!userResponse.ok) {
    logResult('User Registration for Delivery Partner', false, userResponse.data?.error);
    return false;
  }

  logResult('User Registration for Delivery Partner', true, 'User account created');
  
  // Login as the newly created user
  const loginResponse = await makeRequest('/api/auth/login', 'POST', {
    email: uniqueEmail,
    password: 'password123'
  });

  if (!loginResponse.ok) {
    logResult('Delivery Partner Login', false, loginResponse.data?.error);
    return false;
  }

  testState.deliveryPartnerToken = loginResponse.data.token;
  const userId = loginResponse.data.user.id;

  // Create delivery partner profile
  const partnerResponse = await makeRequest('/api/delivery-partners/signup', 'POST', {
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

  if (partnerResponse.ok) {
    testState.deliveryPartner = partnerResponse.data;
    logResult('Delivery Partner Profile Creation', true, `Partner ID: ${testState.deliveryPartner.id}`);
    return true;
  } else {
    logResult('Delivery Partner Profile Creation', false, partnerResponse.data?.error);
    return false;
  }
}

async function testDeliveryPartnerApproval() {
  console.log('\n=== STEP 3: Delivery Partner Approval ===');
  
  if (!testState.deliveryPartner || !testState.adminUser) {
    logResult('Delivery Partner Approval', false, 'Missing required data');
    return false;
  }

  const response = await makeRequest(
    `/api/delivery-partners/${testState.deliveryPartner.id}/approve`,
    'POST',
    { adminId: testState.adminUser.id },
    testState.adminToken
  );

  if (response.ok) {
    logResult('Delivery Partner Approval', true, 'Partner approved successfully');
    return true;
  } else {
    logResult('Delivery Partner Approval', false, response.data?.error);
    return false;
  }
}

async function testCustomerRegistration() {
  console.log('\n=== STEP 4: Customer Registration ===');
  
  // Generate unique email to avoid conflicts
  const timestamp = Date.now();
  const uniqueEmail = `customer${timestamp}@test.com`;
  const uniquePhone = `987654${timestamp.toString().slice(-4)}`;
  
  const response = await makeRequest('/api/auth/register', 'POST', {
    fullName: 'Test Customer',
    email: uniqueEmail,
    password: 'password123',
    phone: uniquePhone,
    address: 'Customer Address, Siraha',
    role: 'customer'
  });

  if (response.ok) {
    // Login as customer
    const loginResponse = await makeRequest('/api/auth/login', 'POST', {
      email: uniqueEmail,
      password: 'password123'
    });

    if (loginResponse.ok) {
      testState.customer = loginResponse.data.user;
      testState.customerToken = loginResponse.data.token;
      logResult('Customer Registration & Login', true, `Customer ID: ${testState.customer.id}`);
      return true;
    }
  }
  
  logResult('Customer Registration', false, response.data?.error);
  return false;
}

async function testStoreAndProductSetup() {
  console.log('\n=== STEP 5: Store and Product Setup ===');
  
  // Get existing store or create one
  const storesResponse = await makeRequest('/api/stores');
  
  if (storesResponse.ok && storesResponse.data.length > 0) {
    testState.store = storesResponse.data[0];
    logResult('Store Selection', true, `Using store: ${testState.store.name}`);
  } else {
    logResult('Store Selection', false, 'No stores available');
    return false;
  }

  // Get existing product or use first available
  const productsResponse = await makeRequest('/api/products');
  
  if (productsResponse.ok && productsResponse.data.length > 0) {
    testState.product = productsResponse.data[0];
    logResult('Product Selection', true, `Using product: ${testState.product.name}`);
    return true;
  } else {
    logResult('Product Selection', false, 'No products available');
    return false;
  }
}

async function testOrderPlacement() {
  console.log('\n=== STEP 6: Order Placement ===');
  
  if (!testState.customer || !testState.product) {
    logResult('Order Placement', false, 'Missing customer or product data');
    return false;
  }

  // Add item to cart
  const cartResponse = await makeRequest('/api/cart', 'POST', {
    productId: testState.product.id,
    quantity: 2
  }, testState.customerToken);

  if (!cartResponse.ok) {
    logResult('Add to Cart', false, cartResponse.data?.error);
    return false;
  }

  logResult('Add to Cart', true, 'Product added to cart');

  // Place order
  const orderResponse = await makeRequest('/api/orders', 'POST', {
    shippingAddress: 'Test Delivery Address, Siraha',
    paymentMethod: 'cash_on_delivery',
    phone: testState.customer.phone,
    customerName: testState.customer.fullName,
    latitude: 26.6616,
    longitude: 86.2089
  }, testState.customerToken);

  if (orderResponse.ok) {
    testState.order = orderResponse.data;
    logResult('Order Placement', true, `Order ID: ${testState.order.id}, Amount: Rs. ${testState.order.totalAmount}`);
    return true;
  } else {
    logResult('Order Placement', false, orderResponse.data?.error);
    return false;
  }
}

async function testDeliveryAssignment() {
  console.log('\n=== STEP 7: Delivery Assignment ===');
  
  if (!testState.order || !testState.deliveryPartner) {
    logResult('Delivery Assignment', false, 'Missing order or delivery partner data');
    return false;
  }

  // Create delivery record
  const deliveryResponse = await makeRequest('/api/deliveries', 'POST', {
    orderId: testState.order.id,
    deliveryFee: 50.00,
    pickupAddress: testState.store.address,
    deliveryAddress: testState.order.shippingAddress,
    estimatedDistance: 5.2,
    estimatedTime: 30
  }, testState.adminToken);

  if (!deliveryResponse.ok) {
    logResult('Delivery Creation', false, deliveryResponse.data?.error);
    return false;
  }

  const deliveryId = deliveryResponse.data.id;
  logResult('Delivery Creation', true, `Delivery ID: ${deliveryId}`);

  // Assign to delivery partner
  const assignResponse = await makeRequest(
    `/api/deliveries/${deliveryId}/assign/${testState.deliveryPartner.id}`,
    'POST',
    {},
    testState.adminToken
  );

  if (assignResponse.ok) {
    testState.delivery = assignResponse.data;
    logResult('Delivery Assignment', true, `Assigned to partner ID: ${testState.deliveryPartner.id}`);
    return true;
  } else {
    logResult('Delivery Assignment', false, assignResponse.data?.error);
    return false;
  }
}

async function testOrderTracking() {
  console.log('\n=== STEP 8: Order Tracking ===');
  
  if (!testState.order) {
    logResult('Order Tracking', false, 'No order to track');
    return false;
  }

  const trackingResponse = await makeRequest(`/api/orders/${testState.order.id}/tracking`);

  if (trackingResponse.ok) {
    logResult('Order Tracking', true, `Tracking data retrieved for order ${testState.order.id}`);
    return true;
  } else {
    logResult('Order Tracking', false, trackingResponse.data?.error);
    return false;
  }
}

async function testDeliveryStatusUpdates() {
  console.log('\n=== STEP 9: Delivery Status Updates ===');
  
  if (!testState.delivery) {
    logResult('Delivery Status Updates', false, 'No delivery to update');
    return false;
  }

  // Update to picked up
  const pickupResponse = await makeRequest(
    `/api/deliveries/${testState.delivery.id}/status`,
    'PATCH',
    { status: 'picked_up' },
    testState.deliveryPartnerToken
  );

  if (pickupResponse.ok) {
    logResult('Delivery Status Update - Picked Up', true, 'Status updated to picked up');
  } else {
    logResult('Delivery Status Update - Picked Up', false, pickupResponse.data?.error);
  }

  // Update to in transit
  const transitResponse = await makeRequest(
    `/api/deliveries/${testState.delivery.id}/status`,
    'PATCH',
    { status: 'in_transit' },
    testState.deliveryPartnerToken
  );

  if (transitResponse.ok) {
    logResult('Delivery Status Update - In Transit', true, 'Status updated to in transit');
    return true;
  } else {
    logResult('Delivery Status Update - In Transit', false, transitResponse.data?.error);
    return false;
  }
}

async function testNotificationSystem() {
  console.log('\n=== STEP 10: Notification System ===');
  
  if (!testState.customer || !testState.deliveryPartner) {
    logResult('Notification System', false, 'Missing user data');
    return false;
  }

  // Check customer notifications
  const customerNotifications = await makeRequest(
    `/api/notifications/${testState.customer.id}`,
    'GET',
    null,
    testState.customerToken
  );

  if (customerNotifications.ok) {
    logResult('Customer Notifications', true, `Found ${customerNotifications.data.length} notifications`);
  }

  // Check delivery partner notifications
  const partnerNotifications = await makeRequest(
    `/api/delivery-notifications/${testState.deliveryPartner.userId}`,
    'GET',
    null,
    testState.deliveryPartnerToken
  );

  if (partnerNotifications.ok) {
    logResult('Delivery Partner Notifications', true, `Found ${partnerNotifications.data.length} notifications`);
    return true;
  }

  return false;
}

async function runComprehensiveTest() {
  console.log('🚀 STARTING COMPREHENSIVE DELIVERY PARTNER TO ORDER TEST');
  console.log('=' .repeat(60));

  const tests = [
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Delivery Partner Registration', fn: testDeliveryPartnerRegistration },
    { name: 'Delivery Partner Approval', fn: testDeliveryPartnerApproval },
    { name: 'Customer Registration', fn: testCustomerRegistration },
    { name: 'Store and Product Setup', fn: testStoreAndProductSetup },
    { name: 'Order Placement', fn: testOrderPlacement },
    { name: 'Delivery Assignment', fn: testDeliveryAssignment },
    { name: 'Order Tracking', fn: testOrderTracking },
    { name: 'Delivery Status Updates', fn: testDeliveryStatusUpdates },
    { name: 'Notification System', fn: testNotificationSystem }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
        console.log(`⚠️  Test failed: ${test.name}`);
      }
    } catch (error) {
      failed++;
      console.log(`💥 Test error in ${test.name}: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! The delivery partner to order flow is working perfectly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the error messages above.');
  }

  // Display final state
  console.log('\n📋 FINAL TEST STATE:');
  console.log(`Customer ID: ${testState.customer?.id || 'N/A'}`);
  console.log(`Delivery Partner ID: ${testState.deliveryPartner?.id || 'N/A'}`);
  console.log(`Store ID: ${testState.store?.id || 'N/A'}`);
  console.log(`Product ID: ${testState.product?.id || 'N/A'}`);
  console.log(`Order ID: ${testState.order?.id || 'N/A'}`);
  console.log(`Delivery ID: ${testState.delivery?.id || 'N/A'}`);
}

// Run the test
runComprehensiveTest().catch(console.error);