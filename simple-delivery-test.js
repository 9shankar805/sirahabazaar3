const BASE_URL = 'http://localhost:5000';

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

async function runQuickTest() {
  console.log('🚀 DELIVERY PARTNER TO ORDER FLOW TEST');
  console.log('=' .repeat(50));

  const timestamp = Date.now();
  let testResults = {
    deliveryPartner: null,
    customer: null,
    order: null
  };

  // 1. Create Delivery Partner
  console.log('\n1. Creating Delivery Partner...');
  const deliveryUserRes = await makeRequest('/api/auth/register', 'POST', {
    fullName: 'Test Delivery Partner',
    email: `delivery${timestamp}@test.com`,
    password: 'password123',
    phone: `987654${timestamp.toString().slice(-4)}`,
    address: 'Test Address, Siraha',
    role: 'delivery_partner'
  });

  if (deliveryUserRes.ok) {
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      email: `delivery${timestamp}@test.com`,
      password: 'password123'
    });

    if (loginRes.ok) {
      const partnerRes = await makeRequest('/api/delivery-partners/signup', 'POST', {
        userId: loginRes.data.user.id,
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

      if (partnerRes.ok) {
        testResults.deliveryPartner = partnerRes.data;
        logResult('Delivery Partner Creation', true, `Partner ID: ${partnerRes.data.id}`);
      } else {
        logResult('Delivery Partner Creation', false, partnerRes.data?.error);
      }
    }
  } else {
    logResult('Delivery Partner Creation', false, deliveryUserRes.data?.error);
  }

  // 2. Create Customer
  console.log('\n2. Creating Customer...');
  const customerRes = await makeRequest('/api/auth/register', 'POST', {
    fullName: 'Test Customer',
    email: `customer${timestamp}@test.com`,
    password: 'password123',
    phone: `987655${timestamp.toString().slice(-4)}`,
    address: 'Customer Address, Siraha',
    role: 'customer'
  });

  if (customerRes.ok) {
    const customerLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: `customer${timestamp}@test.com`,
      password: 'password123'
    });

    if (customerLoginRes.ok) {
      testResults.customer = customerLoginRes.data.user;
      logResult('Customer Creation', true, `Customer ID: ${testResults.customer.id}`);
    } else {
      logResult('Customer Login', false, customerLoginRes.data?.error);
    }
  } else {
    logResult('Customer Creation', false, customerRes.data?.error);
  }

  // 3. Get Store and Product
  console.log('\n3. Getting Store and Product...');
  const storesRes = await makeRequest('/api/stores');
  const productsRes = await makeRequest('/api/products');

  let store = null;
  let product = null;

  if (storesRes.ok && storesRes.data.length > 0) {
    store = storesRes.data[0];
    logResult('Store Selection', true, `Using: ${store.name}`);
  }

  if (productsRes.ok && productsRes.data.length > 0) {
    product = productsRes.data[0];
    logResult('Product Selection', true, `Using: ${product.name}`);
  }

  // 4. Add to Cart and Place Order
  console.log('\n4. Testing Cart and Order Flow...');
  console.log(`   Customer: ${testResults.customer ? 'Available' : 'Missing'}`);
  console.log(`   Product: ${product ? 'Available' : 'Missing'}`);
  console.log(`   Store: ${store ? 'Available' : 'Missing'}`);
  
  if (testResults.customer && product && store) {
    console.log(`   Customer ID: ${testResults.customer.id}`);
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Store ID: ${store.id}`);
    
    // Add to cart
    const cartRes = await makeRequest('/api/cart', 'POST', {
      userId: testResults.customer.id,
      productId: product.id,
      quantity: 2
    });

    if (cartRes.ok) {
      logResult('Add to Cart', true);

      // Get cart items
      const cartItemsRes = await makeRequest(`/api/cart/${testResults.customer.id}`, 'GET');
      
      if (cartItemsRes.ok && cartItemsRes.data.length > 0) {
        const cartItems = cartItemsRes.data;
        const totalAmount = cartItems.reduce((sum, item) => {
          const price = parseFloat(product.price);
          return sum + (item.quantity * price);
        }, 0);

        // Place order
        const orderData = {
          order: {
            customerId: testResults.customer.id,
            totalAmount: totalAmount.toFixed(2),
            status: 'pending',
            shippingAddress: 'Test Delivery Address, Siraha',
            paymentMethod: 'cash_on_delivery',
            phone: testResults.customer.phone,
            customerName: testResults.customer.fullName,
            latitude: '26.6616',
            longitude: '86.2089'
          },
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
            storeId: store.id
          }))
        };

        const orderRes = await makeRequest('/api/orders', 'POST', orderData);

        if (orderRes.ok) {
          testResults.order = orderRes.data.order || orderRes.data;
          logResult('Order Placement', true, `Order ID: ${testResults.order.id}, Amount: Rs. ${testResults.order.totalAmount}`);
        } else {
          logResult('Order Placement', false, orderRes.data?.error);
        }
      }
    } else {
      logResult('Add to Cart', false, cartRes.data?.error);
    }
  }

  // 5. Test Order Tracking
  if (testResults.order) {
    console.log('\n5. Testing Order Tracking...');
    const trackingRes = await makeRequest(`/api/orders/${testResults.order.id}/tracking`);
    
    if (trackingRes.ok) {
      logResult('Order Tracking', true, `Tracking data available`);
    } else {
      logResult('Order Tracking', false, trackingRes.data?.error);
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const results = [
    testResults.deliveryPartner ? 'Delivery Partner Created' : 'Delivery Partner Failed',
    testResults.customer ? 'Customer Created' : 'Customer Failed',
    testResults.order ? 'Order Placed Successfully' : 'Order Failed'
  ];

  results.forEach(result => {
    const success = !result.includes('Failed');
    logResult(result, success);
  });

  if (testResults.deliveryPartner && testResults.customer && testResults.order) {
    console.log('\n🎉 DELIVERY PARTNER TO ORDER FLOW: WORKING PERFECTLY!');
    console.log(`✅ Delivery Partner ID: ${testResults.deliveryPartner.id}`);
    console.log(`✅ Customer ID: ${testResults.customer.id}`);
    console.log(`✅ Order ID: ${testResults.order.id}`);
    console.log(`✅ Order Amount: Rs. ${testResults.order.totalAmount}`);
  } else {
    console.log('\n⚠️  Some components failed. Check logs above for details.');
  }
}

runQuickTest().catch(console.error);