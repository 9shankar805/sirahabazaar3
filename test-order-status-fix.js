import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAPI(endpoint, method = 'GET', data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
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

  const response = await fetch(url, options);
  return {
    status: response.status,
    data: response.ok ? await response.json() : await response.text(),
    ok: response.ok
  };
}

function logResult(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) console.log(`   ${details}`);
  console.log('');
}

async function testOrderStatusUpdate() {
  console.log('🧪 Testing Order Status Update Functionality\n');

  try {
    // First, login as a shopkeeper
    console.log('1. Logging in as shopkeeper...');
    const loginResponse = await testAPI('/api/auth/login', 'POST', {
      email: '900501shanka@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.ok) {
      logResult('Shopkeeper Login', false, `Status: ${loginResponse.status}, Response: ${loginResponse.data}`);
      return;
    }

    const user = loginResponse.data.user;
    logResult('Shopkeeper Login', true, `Logged in as: ${user.username} (ID: ${user.id})`);

    // Get the shopkeeper's store
    console.log('2. Getting shopkeeper store...');
    const storeResponse = await testAPI(`/api/stores/owner/${user.id}`);
    
    if (!storeResponse.ok || !storeResponse.data.length) {
      logResult('Get Store', false, 'No store found for shopkeeper');
      return;
    }

    const store = storeResponse.data[0];
    logResult('Get Store', true, `Store: ${store.name} (ID: ${store.id})`);

    // Get orders for the store
    console.log('3. Getting store orders...');
    const ordersResponse = await testAPI(`/api/orders/store/${store.id}`);
    
    if (!ordersResponse.ok) {
      logResult('Get Orders', false, `Status: ${ordersResponse.status}, Response: ${ordersResponse.data}`);
      return;
    }

    const orders = ordersResponse.data;
    logResult('Get Orders', true, `Found ${orders.length} orders`);

    if (orders.length === 0) {
      console.log('No orders found to test status update');
      return;
    }

    // Test updating order status
    const testOrder = orders[0];
    console.log(`4. Testing status update for Order #${testOrder.id}...`);
    console.log(`   Current status: ${testOrder.status}`);

    // Determine new status based on current status
    let newStatus;
    switch (testOrder.status) {
      case 'pending':
        newStatus = 'processing';
        break;
      case 'processing':
        newStatus = 'shipped';
        break;
      case 'shipped':
        newStatus = 'delivered';
        break;
      case 'delivered':
        newStatus = 'pending'; // Reset for testing
        break;
      default:
        newStatus = 'processing';
    }

    console.log(`   Updating to: ${newStatus}`);

    const updateResponse = await testAPI(`/api/orders/${testOrder.id}/status`, 'PUT', {
      status: newStatus,
      description: `Status updated to ${newStatus} via test`
    });

    if (!updateResponse.ok) {
      logResult('Order Status Update', false, `Status: ${updateResponse.status}, Response: ${updateResponse.data}`);
      return;
    }

    const updatedOrder = updateResponse.data;
    logResult('Order Status Update', true, `Status changed from ${testOrder.status} to ${updatedOrder.status}`);

    // Verify the change by fetching the order again
    console.log('5. Verifying status change...');
    const verifyResponse = await testAPI(`/api/orders/${testOrder.id}`);
    
    if (!verifyResponse.ok) {
      logResult('Verify Status Change', false, `Status: ${verifyResponse.status}, Response: ${verifyResponse.data}`);
      return;
    }

    const verifiedOrder = verifyResponse.data;
    const statusMatches = verifiedOrder.status === newStatus;
    logResult('Verify Status Change', statusMatches, 
      statusMatches ? `Confirmed status is now: ${verifiedOrder.status}` : 
      `Expected: ${newStatus}, Got: ${verifiedOrder.status}`);

    // Test with another status change to ensure it's working consistently
    console.log('6. Testing second status update...');
    const secondStatus = newStatus === 'processing' ? 'shipped' : 'processing';
    
    const secondUpdateResponse = await testAPI(`/api/orders/${testOrder.id}/status`, 'PUT', {
      status: secondStatus,
      description: `Second status update to ${secondStatus}`
    });

    if (!secondUpdateResponse.ok) {
      logResult('Second Status Update', false, `Status: ${secondUpdateResponse.status}, Response: ${secondUpdateResponse.data}`);
      return;
    }

    logResult('Second Status Update', true, `Successfully updated to: ${secondStatus}`);

    console.log('🎉 Order status update functionality test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    logResult('Order Status Update Test', false, error.message);
  }
}

// Run the test
testOrderStatusUpdate().catch(console.error);