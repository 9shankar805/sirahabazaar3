import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
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

async function testNotificationFlow() {
  console.log('🚀 Testing Notification Flow to Seller and Delivery Partner Dashboards\n');

  try {
    // Step 1: Create test customer
    console.log('=== STEP 1: Creating Test Customer ===');
    const timestamp = Date.now();
    const customerData = {
      username: `test_customer_${timestamp}`,
      email: `customer_${timestamp}@test.com`,
      password: 'password123',
      fullName: 'Test Customer',
      phone: `+12345${timestamp.toString().slice(-5)}`,
      address: '123 Test Street',
      role: 'customer'
    };

    const customerRes = await makeRequest('/api/auth/register', 'POST', customerData);
    if (!customerRes.ok) {
      logResult('Customer Registration', false, customerRes.data.error);
      return;
    }
    logResult('Customer Registration', true, `Customer ID: ${customerRes.data.user.id}`);
    const customer = customerRes.data.user;

    // Step 2: Create test seller and store
    console.log('\n=== STEP 2: Creating Test Seller and Store ===');
    const sellerData = {
      username: `test_seller_${timestamp}`,
      email: `seller_${timestamp}@test.com`,
      password: 'password123',
      fullName: 'Test Seller',
      phone: `+12346${timestamp.toString().slice(-5)}`,
      address: '456 Seller Street',
      role: 'shopkeeper'
    };

    const sellerRes = await makeRequest('/api/auth/register', 'POST', sellerData);
    if (!sellerRes.ok) {
      logResult('Seller Registration', false, sellerRes.data.error);
      return;
    }
    logResult('Seller Registration', true, `Seller ID: ${sellerRes.data.user.id}`);
    const seller = sellerRes.data.user;

    // Create store
    const storeData = {
      name: `Test Store ${Date.now()}`,
      slug: `test-store-${Date.now()}`,
      description: 'Test store for notifications',
      ownerId: seller.id,
      address: '456 Store Street',
      city: 'Test City',
      state: 'Test State',
      phone: '+1234567892'
    };

    const storeRes = await makeRequest('/api/stores', 'POST', storeData);
    if (!storeRes.ok) {
      logResult('Store Creation', false, storeRes.data.error);
      return;
    }
    logResult('Store Creation', true, `Store ID: ${storeRes.data.id}`);
    const store = storeRes.data;

    // Step 3: Create test product
    console.log('\n=== STEP 3: Creating Test Product ===');
    const productData = {
      name: `Test Product ${Date.now()}`,
      slug: `test-product-${Date.now()}`,
      description: 'Test product for notifications',
      price: '99.99',
      categoryId: 1,
      storeId: store.id,
      stock: 10,
      imageUrl: 'https://via.placeholder.com/300'
    };

    const productRes = await makeRequest('/api/products', 'POST', productData);
    if (!productRes.ok) {
      logResult('Product Creation', false, productRes.data.error);
      return;
    }
    logResult('Product Creation', true, `Product ID: ${productRes.data.id}`);
    const product = productRes.data;

    // Step 4: Create test delivery partner
    console.log('\n=== STEP 4: Creating Test Delivery Partner ===');
    const deliveryPartnerData = {
      username: `delivery_partner_${timestamp}`,
      email: `delivery_${timestamp}@test.com`,
      password: 'password123',
      fullName: 'Test Delivery Partner',
      phone: `+12347${timestamp.toString().slice(-5)}`,
      address: '789 Delivery Street',
      role: 'delivery_partner'
    };

    const deliveryPartnerRes = await makeRequest('/api/auth/register', 'POST', deliveryPartnerData);
    if (!deliveryPartnerRes.ok) {
      logResult('Delivery Partner Registration', false, deliveryPartnerRes.data.error);
      return;
    }
    logResult('Delivery Partner Registration', true, `Partner ID: ${deliveryPartnerRes.data.user.id}`);
    const deliveryPartner = deliveryPartnerRes.data.user;

    // Create delivery partner profile
    const partnerProfileData = {
      userId: deliveryPartner.id,
      vehicleType: 'bike',
      vehicleNumber: 'TEST123',
      drivingLicense: 'DL123456789',
      idProofType: 'aadhar',
      idProofNumber: '123456789012',
      emergencyContact: '+1234567894',
      bankAccountNumber: '1234567890',
      ifscCode: 'TEST0001',
      status: 'approved',
      isAvailable: true
    };

    const partnerProfileRes = await makeRequest('/api/delivery-partners/signup', 'POST', partnerProfileData);
    if (!partnerProfileRes.ok) {
      logResult('Delivery Partner Profile', false, partnerProfileRes.data.error);
      return;
    }
    logResult('Delivery Partner Profile', true, 'Profile created');

    // Step 5: Place order to trigger notifications
    console.log('\n=== STEP 5: Placing Order to Test Notifications ===');
    const orderData = {
      order: {
        customerId: customer.id,
        totalAmount: '199.98',
        status: 'pending',
        shippingAddress: '123 Customer Street, Test City',
        paymentMethod: 'card',
        phone: customer.phone,
        customerName: customer.fullName,
        latitude: '27.7172',
        longitude: '85.3240'
      },
      items: [
        {
          productId: product.id,
          quantity: 2,
          price: product.price,
          storeId: product.storeId
        }
      ]
    };

    const orderRes = await makeRequest('/api/orders', 'POST', orderData);
    if (!orderRes.ok) {
      logResult('Order Placement', false, orderRes.data.error);
      return;
    }
    logResult('Order Placement', true, `Order ID: ${orderRes.data.order.id}`);
    const order = orderRes.data.order;

    // Wait for notifications to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Check seller dashboard notifications
    console.log('\n=== STEP 6: Checking Seller Dashboard Notifications ===');
    const sellerNotificationsRes = await makeRequest(`/api/notifications/${seller.id}`, 'GET');
    if (sellerNotificationsRes.ok) {
      const sellerNotifications = sellerNotificationsRes.data.filter(n => n.orderId === order.id);
      if (sellerNotifications.length > 0) {
        logResult('Seller Dashboard Notifications', true, `Found ${sellerNotifications.length} notifications`);
        sellerNotifications.forEach(notification => {
          console.log(`   - ${notification.title}: ${notification.message}`);
        });
      } else {
        logResult('Seller Dashboard Notifications', false, 'No order notifications found');
      }
    } else {
      logResult('Seller Dashboard Notifications Check', false, sellerNotificationsRes.data.error);
    }

    // Step 7: Send delivery notification to trigger delivery partner notifications
    console.log('\n=== STEP 7: Sending Delivery Assignment Notification ===');
    const deliveryNotificationData = {
      orderId: order.id,
      message: `📦 New Delivery Available: Order #${order.id} from ${customer.fullName}. Amount: ₹${order.totalAmount}. Accept to claim this delivery!`,
      storeId: store.id,
      shopkeeperId: seller.id,
      urgent: false,
      notificationType: "first_accept_first_serve"
    };

    const deliveryNotificationRes = await makeRequest('/api/notifications/delivery-assignment', 'POST', deliveryNotificationData);
    if (deliveryNotificationRes.ok) {
      logResult('Delivery Assignment Notification', true, 'Notification sent to delivery partners');
    } else {
      logResult('Delivery Assignment Notification', false, deliveryNotificationRes.data.error);
    }

    // Wait for delivery notifications to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 8: Check delivery partner dashboard notifications
    console.log('\n=== STEP 8: Checking Delivery Partner Dashboard Notifications ===');
    const deliveryNotificationsRes = await makeRequest('/api/delivery-notifications', 'GET');
    if (deliveryNotificationsRes.ok) {
      const orderNotifications = deliveryNotificationsRes.data.filter(n => n.order_id === order.id);
      if (orderNotifications.length > 0) {
        logResult('Delivery Partner Dashboard Notifications', true, `Found ${orderNotifications.length} notifications`);
        orderNotifications.forEach(notification => {
          const data = JSON.parse(notification.notification_data);
          console.log(`   - Order #${notification.order_id} for ${data.customerName}, Amount: ₹${data.totalAmount}`);
        });
      } else {
        logResult('Delivery Partner Dashboard Notifications', false, 'No delivery notifications found');
      }
    } else {
      logResult('Delivery Partner Dashboard Notifications Check', false, deliveryNotificationsRes.data.error);
    }

    // Step 9: Test delivery partner accepting order
    console.log('\n=== STEP 9: Testing Delivery Partner Order Acceptance ===');
    const deliveryNotificationsCheck = await makeRequest('/api/delivery-notifications', 'GET');
    if (deliveryNotificationsCheck.ok && deliveryNotificationsCheck.data.length > 0) {
      const orderNotification = deliveryNotificationsCheck.data.find(n => n.order_id === order.id);
      if (orderNotification) {
        const acceptOrderRes = await makeRequest(`/api/delivery-notifications/${order.id}/accept`, 'POST', {
          deliveryPartnerId: orderNotification.delivery_partner_id
        });
        
        if (acceptOrderRes.ok) {
          logResult('Delivery Partner Order Acceptance', true, 'Order accepted successfully');
          
          // Check if seller gets notification about delivery assignment
          await new Promise(resolve => setTimeout(resolve, 2000));
          const sellerUpdatedNotificationsRes = await makeRequest(`/api/notifications/${seller.id}`, 'GET');
          if (sellerUpdatedNotificationsRes.ok) {
            const assignmentNotifications = sellerUpdatedNotificationsRes.data.filter(n => 
              n.orderId === order.id && n.type === 'order_update'
            );
            if (assignmentNotifications.length > 0) {
              logResult('Seller Assignment Notification', true, 'Seller notified about delivery assignment');
            } else {
              logResult('Seller Assignment Notification', false, 'Seller not notified about delivery assignment');
            }
          }
        } else {
          logResult('Delivery Partner Order Acceptance', false, acceptOrderRes.data.error);
        }
      }
    }

    console.log('\n🎉 Notification Flow Test Completed!');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testNotificationFlow();