import { Pool } from 'pg';

async function setupTrackingDemo() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Setting up real-time tracking demonstration...');

    // Create test delivery partner
    const deliveryPartnerResult = await pool.query(`
      INSERT INTO users (username, password, email, role, full_name, phone)
      VALUES ('delivery_partner_1', '$2b$10$abcd1234', 'delivery@test.com', 'delivery_partner', 'John Delivery', '+9771234567890')
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `);
    
    const deliveryPartnerId = deliveryPartnerResult.rows[0].id;
    console.log(`Created delivery partner with ID: ${deliveryPartnerId}`);

    // Create test delivery record
    const deliveryResult = await pool.query(`
      INSERT INTO deliveries (
        order_id, delivery_partner_id, pickup_address, delivery_address,
        pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude,
        status, estimated_delivery_time, delivery_fee
      ) VALUES (
        1, $1, 
        'Tech World Electronics, 123 Tech Street', 
        '789 Customer Street, Kathmandu',
        26.6593, 86.1924, 26.6600, 86.1930,
        'assigned', NOW() + INTERVAL '30 minutes', '150.00'
      )
      RETURNING id;
    `, [deliveryPartnerId]);

    const deliveryId = deliveryResult.rows[0].id;
    console.log(`Created delivery with ID: ${deliveryId}`);

    // Add initial location tracking
    await pool.query(`
      INSERT INTO delivery_location_tracking (
        delivery_id, delivery_partner_id, current_latitude, current_longitude,
        speed, heading, accuracy, timestamp
      ) VALUES (
        $1, $2, 26.6593, 86.1924, 0, 0, 10, NOW()
      );
    `, [deliveryId, deliveryPartnerId]);

    // Add route information
    await pool.query(`
      INSERT INTO delivery_routes (
        delivery_id, pickup_latitude, pickup_longitude,
        delivery_latitude, delivery_longitude, route_geometry,
        distance_meters, estimated_duration_seconds
      ) VALUES (
        $1, 26.6593, 86.1924, 26.6600, 86.1930,
        'LINESTRING(86.1924 26.6593, 86.1930 26.6600)',
        1200, 420
      );
    `, [deliveryId]);

    // Add status history
    await pool.query(`
      INSERT INTO delivery_status_history (
        delivery_id, status, description, timestamp
      ) VALUES 
        ($1, 'assigned', 'Order assigned to delivery partner', NOW() - INTERVAL '5 minutes'),
        ($1, 'picked_up', 'Package picked up from store', NOW() - INTERVAL '2 minutes');
    `, [deliveryId]);

    console.log('✅ Demo data setup complete!');
    console.log(`Delivery ID: ${deliveryId}`);
    console.log(`Delivery Partner ID: ${deliveryPartnerId}`);
    console.log('You can now test:');
    console.log(`- Tracking: /api/tracking/${deliveryId}`);
    console.log(`- Location updates: /api/tracking/${deliveryId}/location`);
    console.log('- WebSocket: ws://localhost:5000/ws');

  } catch (error) {
    console.error('Setup failed:', error.message);
  } finally {
    await pool.end();
  }
}

setupTrackingDemo();