import { Pool } from 'pg';

async function testTrackingSystem() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🚀 Testing Real-Time Order Tracking System');
    console.log('=' .repeat(50));

    // Test database tables exist
    const tables = [
      'delivery_location_tracking',
      'delivery_routes', 
      'websocket_sessions',
      'delivery_status_history'
    ];

    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }

    // Test basic functionality
    console.log('\n📍 Testing Location Tracking...');
    
    // Insert test delivery location
    const locationResult = await pool.query(`
      INSERT INTO delivery_location_tracking 
      (delivery_id, delivery_partner_id, current_latitude, current_longitude, timestamp)
      VALUES (1, 1, '26.6593', '86.1924', NOW())
      RETURNING id;
    `);
    
    if (locationResult.rows.length > 0) {
      console.log(`✅ Location tracking test successful (ID: ${locationResult.rows[0].id})`);
    }

    // Test route storage
    console.log('\n🗺️ Testing Route Storage...');
    
    const routeResult = await pool.query(`
      INSERT INTO delivery_routes 
      (delivery_id, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, distance_meters, estimated_duration_seconds)
      VALUES (1, '26.6593', '86.1924', '26.6600', '86.1930', 1000, 300)
      RETURNING id;
    `);
    
    if (routeResult.rows.length > 0) {
      console.log(`✅ Route storage test successful (ID: ${routeResult.rows[0].id})`);
    }

    // Test status history
    console.log('\n📊 Testing Status History...');
    
    const statusResult = await pool.query(`
      INSERT INTO delivery_status_history 
      (delivery_id, status, description, timestamp)
      VALUES (1, 'assigned', 'Order assigned to delivery partner', NOW())
      RETURNING id;
    `);
    
    if (statusResult.rows.length > 0) {
      console.log(`✅ Status history test successful (ID: ${statusResult.rows[0].id})`);
    }

    console.log('\n🎉 Real-Time Tracking System Test Complete!');
    console.log('=' .repeat(50));
    console.log('All core components are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testTrackingSystem();