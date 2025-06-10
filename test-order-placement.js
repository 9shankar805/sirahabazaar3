import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function setupTestData() {
  try {
    // Create a test customer user
    const userResult = await pool.query(`
      INSERT INTO users (username, email, password, full_name, phone, address, city, state, role, status)
      VALUES ('testcustomer2', 'test2@customer.com', '$2b$10$hash', 'Test Customer', '+1234567890', '123 Test St', 'Test City', 'Test State', 'customer', 'active')
      ON CONFLICT (email) DO UPDATE SET id = users.id
      RETURNING id
    `);
    
    const customerId = userResult.rows[0].id;
    console.log('✅ Test customer created/found with ID:', customerId);
    
    // Get an existing product and store
    const productResult = await pool.query('SELECT id, store_id, price FROM products LIMIT 1');
    if (productResult.rows.length === 0) {
      throw new Error('No products found in database');
    }
    
    const product = productResult.rows[0];
    console.log('✅ Using product ID:', product.id, 'from store ID:', product.store_id);
    
    return { customerId, product };
  } catch (error) {
    console.error('Setup error:', error.message);
    throw error;
  }
}

async function testOrderPlacement(customerId, product) {
  try {
    console.log('\n🧪 Testing order placement...');
    
    // Test the order placement API
    const orderData = {
      order: {
        customerId: customerId,
        totalAmount: '199.98',
        status: 'pending',
        shippingAddress: '123 Test Street, Test City',
        paymentMethod: 'card',
        phone: '+1234567890',
        customerName: 'Test Customer',
        latitude: '27.7172',
        longitude: '85.3240'
      },
      items: [
        {
          productId: product.id,
          quantity: 2,
          price: product.price,
          storeId: product.store_id
        }
      ]
    };
    
    const response = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Order placement successful!');
      console.log('   Order ID:', result.order.id);
      console.log('   Order items:', result.items.length);
      
      // Verify order items have store_id
      const orderItems = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [result.order.id]);
      console.log('✅ Order items in database:');
      orderItems.rows.forEach(item => {
        console.log(`   - Product ${item.product_id}, Store ${item.store_id}, Qty: ${item.quantity}`);
      });
      
      return result.order.id;
    } else {
      console.log('❌ Order placement failed:');
      console.log('   Status:', response.status);
      console.log('   Error:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return null;
  }
}

async function verifyOrderTracking(orderId) {
  try {
    console.log('\n🔍 Verifying order tracking...');
    
    const trackingResult = await pool.query('SELECT * FROM order_tracking WHERE order_id = $1', [orderId]);
    
    if (trackingResult.rows.length > 0) {
      console.log('✅ Order tracking created:');
      trackingResult.rows.forEach(track => {
        console.log(`   - Status: ${track.status}, Description: ${track.description}`);
      });
    } else {
      console.log('❌ No order tracking found');
    }
    
    // Check notifications
    const notificationResult = await pool.query('SELECT * FROM notifications WHERE order_id = $1', [orderId]);
    console.log('✅ Notifications created:', notificationResult.rows.length);
    
  } catch (error) {
    console.error('Verification error:', error.message);
  }
}

async function runTest() {
  try {
    console.log('🚀 Starting order placement test...\n');
    
    const { customerId, product } = await setupTestData();
    const orderId = await testOrderPlacement(customerId, product);
    
    if (orderId) {
      await verifyOrderTracking(orderId);
      console.log('\n✅ Order placement system is working correctly!');
    } else {
      console.log('\n❌ Order placement system has issues');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Use a simple HTTP client for Node.js
global.fetch = async (url, options = {}) => {
  const http = await import('http');
  const urlParts = new URL(url);
  
  return new Promise((resolve, reject) => {
    const req = http.default.request({
      hostname: urlParts.hostname,
      port: urlParts.port,
      path: urlParts.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
};

runTest();