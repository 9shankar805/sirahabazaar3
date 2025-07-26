import { Client } from 'pg';

async function createSampleOrders() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // First, let's check if we have stores and products
    const storesResult = await client.query('SELECT * FROM stores LIMIT 3');
    const productsResult = await client.query('SELECT * FROM products LIMIT 5');
    
    console.log(`Found ${storesResult.rows.length} stores and ${productsResult.rows.length} products`);

    if (storesResult.rows.length === 0 || productsResult.rows.length === 0) {
      console.log('⚠️ Need to create sample stores and products first');
      return;
    }

    const stores = storesResult.rows;
    const products = productsResult.rows;

    // Create sample orders with detailed information
    const sampleOrders = [
      {
        customerId: 66, // Existing user
        storeId: stores[0].id,
        status: 'ready_for_pickup',
        totalAmount: 850,
        paymentMethod: 'COD',
        shippingAddress: 'Siraha Bazaar, Near Central Market, Siraha 56500',
        deliveryLatitude: 26.6586,
        deliveryLongitude: 86.2003,
        customerInstructions: 'Please call before delivery. 2nd floor, blue gate',
        products: [
          { productId: products[0].id, quantity: 2, price: 250 },
          { productId: products[1].id, quantity: 1, price: 350 }
        ]
      },
      {
        customerId: 66,
        storeId: stores[1]?.id || stores[0].id,
        status: 'ready_for_pickup', 
        totalAmount: 1200,
        paymentMethod: 'prepaid',
        shippingAddress: 'Mahendranagar, Ward 5, Siraha',
        deliveryLatitude: 26.6703,
        deliveryLongitude: 86.2156,
        customerInstructions: 'Leave at door if not home',
        products: [
          { productId: products[2]?.id || products[0].id, quantity: 1, price: 800 },
          { productId: products[3]?.id || products[1].id, quantity: 2, price: 200 }
        ]
      },
      {
        customerId: 66,
        storeId: stores[2]?.id || stores[0].id,
        status: 'ready_for_pickup',
        totalAmount: 650,
        paymentMethod: 'COD',
        shippingAddress: 'Hanumannagar, Main Road, Siraha',
        deliveryLatitude: 26.6450,
        deliveryLongitude: 86.1890,
        customerInstructions: 'Ring the bell twice',
        products: [
          { productId: products[4]?.id || products[0].id, quantity: 3, price: 150 },
          { productId: products[0].id, quantity: 1, price: 200 }
        ]
      }
    ];

    for (let i = 0; i < sampleOrders.length; i++) {
      const order = sampleOrders[i];
      
      try {
        // Create order
        const orderResult = await client.query(`
          INSERT INTO orders (
            user_id, status, total_amount, payment_method, shipping_address,
            delivery_latitude, delivery_longitude, customer_instructions, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id
        `, [
          order.customerId, order.status, order.totalAmount, order.paymentMethod,
          order.shippingAddress, order.deliveryLatitude, order.deliveryLongitude,
          order.customerInstructions
        ]);

        const orderId = orderResult.rows[0].id;
        console.log(`📦 Created order ${orderId}`);

        // Create order items
        for (const product of order.products) {
          await client.query(`
            INSERT INTO order_items (order_id, product_id, store_id, quantity, price)
            VALUES ($1, $2, $3, $4, $5)
          `, [orderId, product.productId, order.storeId, product.quantity, product.price]);
        }

        // Create delivery record
        await client.query(`
          INSERT INTO deliveries (
            order_id, status, pickup_address, delivery_address,
            pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          orderId, 'pending', stores[i % stores.length].address || stores[i % stores.length].location,
          order.shippingAddress, stores[i % stores.length].latitude || 26.6603,
          stores[i % stores.length].longitude || 86.2064, order.deliveryLatitude, order.deliveryLongitude
        ]);

        console.log(`🚚 Created delivery for order ${orderId}`);
      } catch (error) {
        console.error(`❌ Error creating order ${i + 1}:`, error.message);
      }
    }

    console.log('✅ Sample delivery orders created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createSampleOrders();