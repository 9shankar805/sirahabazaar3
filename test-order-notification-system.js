import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

let testState = {
  customer: null,
  customerToken: null,
  shopkeeper: null,
  shopkeeperToken: null,
  deliveryPartner1: null,
  deliveryPartner2: null,
  store: null,
  product: null,
  order: null
};

async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      data: { error: error.message }
    };
  }
}

function logResult(testName, success, details = '') {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${testName}${details ? ': ' + details : ''}`);
}

async function createTestUsers() {
  console.log('\n=== STEP 1: Creating Test Users ===');
  
  // Create customer
  const customerData = {
    username: `customer_${Date.now()}`,
    fullName: 'Test Customer',
    email: `customer_${Date.now()}@test.com`,
    password: 'password123',
    phone: '+1234567890',
    role: 'customer'
  };

  const customerRes = await makeRequest('/api/auth/register', 'POST', customerData);
  if (customerRes.ok) {
    testState.customer = customerRes.data.user;
    testState.customerToken = customerRes.data.token;
    logResult('Customer Registration', true, `ID: ${testState.customer.id}`);
  } else {
    logResult('Customer Registration', false, customerRes.data.error);
    return false;
  }

  // Create shopkeeper
  const shopkeeperData = {
    username: `shopkeeper_${Date.now()}`,
    fullName: 'Test Shopkeeper',
    email: `shopkeeper_${Date.now()}@test.com`,
    password: 'password123',
    phone: '+1234567891',
    role: 'store_owner'
  };

  const shopkeeperRes = await makeRequest('/api/auth/register', 'POST', shopkeeperData);
  if (shopkeeperRes.ok) {
    testState.shopkeeper = shopkeeperRes.data.user;
    testState.shopkeeperToken = shopkeeperRes.data.token;
    logResult('Shopkeeper Registration', true, `ID: ${testState.shopkeeper.id}`);
  } else {
    logResult('Shopkeeper Registration', false, shopkeeperRes.data.error);
    return false;
  }

  // Create delivery partners
  for (let i = 1; i <= 2; i++) {
    const partnerData = {
      username: `delivery_${Date.now()}_${i}`,
      fullName: `Test Delivery Partner ${i}`,
      email: `delivery_${Date.now()}_${i}@test.com`,
      password: 'password123',
      phone: `+123456789${i}`,
      role: 'delivery_partner'
    };

    const partnerRes = await makeRequest('/api/auth/register', 'POST', partnerData);
    if (partnerRes.ok) {
      const partnerUser = partnerRes.data.user;
      
      // Create delivery partner profile
      const deliveryPartnerData = {
        vehicleType: 'motorcycle',
        vehicleNumber: `MH12AB123${i}`,
        drivingLicense: `DL12345678${i}`,
        idProofType: 'aadhar',
        idProofNumber: `123412341234123${i}`,
        deliveryAreas: ['Inner City', 'Outer City'],
        emergencyContact: `+987654321${i}`,
        bankAccountNumber: `123456789012345${i}`,
        ifscCode: 'SBIN0000123',
        status: 'approved',
        isAvailable: true
      };

      const dpRes = await makeRequest('/api/delivery-partners', 'POST', deliveryPartnerData, partnerRes.data.token);
      if (dpRes.ok) {
        if (i === 1) {
          testState.deliveryPartner1 = dpRes.data;
        } else {
          testState.deliveryPartner2 = dpRes.data;
        }
        logResult(`Delivery Partner ${i} Profile`, true, `ID: ${dpRes.data.id}`);
      } else {
        logResult(`Delivery Partner ${i} Profile`, false, dpRes.data.error);
      }
    } else {
      logResult(`Delivery Partner ${i} Registration`, false, partnerRes.data.error);
    }
  }

  return true;
}

async function createStoreAndProduct() {
  console.log('\n=== STEP 2: Creating Store and Product ===');
  
  // Create store
  const storeData = {
    name: 'Test Notification Store',
    slug: `test-notification-store-${Date.now()}`,
    description: 'Store for testing notifications',
    category: 'electronics',
    address: '123 Test Street, Test City',
    phone: testState.shopkeeper.phone,
    email: testState.shopkeeper.email,
    ownerId: testState.shopkeeper.id
  };

  const storeRes = await makeRequest('/api/stores', 'POST', storeData, testState.shopkeeperToken);
  if (storeRes.ok) {
    testState.store = storeRes.data;
    logResult('Store Creation', true, `Store ID: ${testState.store.id}`);
  } else {
    logResult('Store Creation', false, storeRes.data.error);
    return false;
  }

  // Create product
  const productData = {
    name: 'Test Notification Product',
    slug: `test-notification-product-${Date.now()}`,
    description: 'Product for testing notifications',
    price: '199.99',
    categoryId: 1,
    storeId: testState.store.id,
    stock: 10,
    images: ['test-image.jpg'],
    status: 'active'
  };

  const productRes = await makeRequest('/api/products', 'POST', productData, testState.shopkeeperToken);
  if (productRes.ok) {
    testState.product = productRes.data;
    logResult('Product Creation', true, `Product ID: ${testState.product.id}`);
    return true;
  } else {
    logResult('Product Creation', false, productRes.data.error);
    return false;
  }
}

async function testOrderPlacementNotifications() {
  console.log('\n=== STEP 3: Testing Order Placement Notifications ===');
  
  // Add product to cart
  const cartData = {
    productId: testState.product.id,
    quantity: 2,
    storeId: testState.store.id
  };

  const cartRes = await makeRequest('/api/cart', 'POST', cartData, testState.customerToken);
  if (!cartRes.ok) {
    logResult('Add to Cart', false, cartRes.data.error);
    return false;
  }
  logResult('Add to Cart', true);

  // Place order
  const orderData = {
    order: {
      customerId: testState.customer.id,
      totalAmount: '399.98',
      status: 'pending',
      shippingAddress: '456 Delivery Street, Test City',
      paymentMethod: 'card',
      phone: testState.customer.phone,
      customerName: testState.customer.fullName,
      latitude: '27.7172',
      longitude: '85.3240'
    },
    items: [
      {
        productId: testState.product.id,
        quantity: 2,
        price: testState.product.price,
        storeId: testState.store.id
      }
    ]
  };

  const orderRes = await makeRequest('/api/orders', 'POST', orderData, testState.customerToken);
  if (orderRes.ok) {
    testState.order = orderRes.data.order;
    logResult('Order Placement', true, `Order ID: ${testState.order.id}`);
    
    // Wait for notifications to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return true;
  } else {
    logResult('Order Placement', false, orderRes.data.error);
    return false;
  }
}

async function verifyShopkeeperNotifications() {
  console.log('\n=== STEP 4: Verifying Shopkeeper Notifications ===');
  
  const notificationsRes = await makeRequest(`/api/notifications/user/${testState.shopkeeper.id}`, 'GET');
  if (notificationsRes.ok) {
    const orderNotifications = notificationsRes.data.filter(n => 
      n.orderId === testState.order.id && n.type === 'order'
    );
    
    if (orderNotifications.length > 0) {
      logResult('Shopkeeper Order Notification', true, `Found ${orderNotifications.length} notifications`);
      console.log('   Notification:', orderNotifications[0].title, '-', orderNotifications[0].message);
      return true;
    } else {
      logResult('Shopkeeper Order Notification', false, 'No order notifications found');
      return false;
    }
  } else {
    logResult('Shopkeeper Notifications Check', false, notificationsRes.data.error);
    return false;
  }
}

async function verifyDeliveryPartnerNotifications() {
  console.log('\n=== STEP 5: Verifying Delivery Partner Notifications ===');
  
  // Check delivery notifications endpoint
  const deliveryNotificationsRes = await makeRequest('/api/delivery-notifications', 'GET');
  if (deliveryNotificationsRes.ok) {
    const orderNotifications = deliveryNotificationsRes.data.filter(n => 
      n.order_id === testState.order.id
    );
    
    if (orderNotifications.length > 0) {
      logResult('Delivery Notifications Available', true, `Found ${orderNotifications.length} notifications`);
      console.log('   Order ID:', orderNotifications[0].order_id);
      console.log('   Customer:', orderNotifications[0].customername);
      console.log('   Amount:', orderNotifications[0].totalamount);
      return orderNotifications;
    } else {
      logResult('Delivery Notifications Available', false, 'No delivery notifications found');
      return [];
    }
  } else {
    logResult('Delivery Notifications Check', false, deliveryNotificationsRes.data.error);
    return [];
  }
}

async function testFirstAcceptFirstServe(notifications) {
  console.log('\n=== STEP 6: Testing First-Accept-First-Serve System ===');
  
  if (notifications.length === 0) {
    logResult('First Accept Test', false, 'No notifications to test with');
    return false;
  }

  const orderId = notifications[0].order_id;
  
  // Delivery Partner 1 accepts the order
  const acceptRes1 = await makeRequest(
    `/api/delivery-notifications/${orderId}/accept`,
    'POST',
    { deliveryPartnerId: testState.deliveryPartner1.id }
  );

  if (acceptRes1.ok) {
    logResult('Partner 1 Accepts Order', true, 'Order accepted successfully');
    
    // Try Delivery Partner 2 accepting the same order (should fail)
    const acceptRes2 = await makeRequest(
      `/api/delivery-notifications/${orderId}/accept`,
      'POST',
      { deliveryPartnerId: testState.deliveryPartner2.id }
    );

    if (!acceptRes2.ok && acceptRes2.status === 409) {
      logResult('Partner 2 Tries Same Order', true, 'Correctly rejected - order already taken');
      return true;
    } else {
      logResult('Partner 2 Tries Same Order', false, 'Should have been rejected but was not');
      return false;
    }
  } else {
    logResult('Partner 1 Accepts Order', false, acceptRes1.data.error);
    return false;
  }
}

async function verifyOrderStatus() {
  console.log('\n=== STEP 7: Verifying Order Status Updates ===');
  
  const orderRes = await makeRequest(`/api/orders/${testState.order.id}`, 'GET');
  if (orderRes.ok) {
    const order = orderRes.data;
    if (order.status === 'assigned_for_delivery') {
      logResult('Order Status Update', true, `Status: ${order.status}`);
      return true;
    } else {
      logResult('Order Status Update', false, `Expected 'assigned_for_delivery', got '${order.status}'`);
      return false;
    }
  } else {
    logResult('Order Status Check', false, orderRes.data.error);
    return false;
  }
}

async function runNotificationSystemTest() {
  console.log('🚀 Starting Order Notification System Test...\n');
  
  try {
    const step1 = await createTestUsers();
    if (!step1) return;

    const step2 = await createStoreAndProduct();
    if (!step2) return;

    const step3 = await testOrderPlacementNotifications();
    if (!step3) return;

    const step4 = await verifyShopkeeperNotifications();
    const notifications = await verifyDeliveryPartnerNotifications();
    
    const step6 = await testFirstAcceptFirstServe(notifications);
    const step7 = await verifyOrderStatus();

    console.log('\n=== FINAL RESULTS ===');
    logResult('User Creation', true);
    logResult('Store & Product Setup', true);
    logResult('Order Placement with Notifications', step3);
    logResult('Shopkeeper Notification', step4);
    logResult('Delivery Partner Notifications', notifications.length > 0);
    logResult('First-Accept-First-Serve System', step6);
    logResult('Order Status Updates', step7);

    if (step3 && step4 && notifications.length > 0 && step6 && step7) {
      console.log('\n✅ ALL TESTS PASSED! Notification system is working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Check the logs above for details.');
    }

  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

// Run the test
runNotificationSystemTest();