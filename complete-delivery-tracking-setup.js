import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function createDeliveryTrackingTables() {
  try {
    console.log('Creating delivery tracking tables...');

    // Create delivery_location_tracking table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS delivery_location_tracking (
        id SERIAL PRIMARY KEY,
        delivery_id INTEGER NOT NULL,
        delivery_partner_id INTEGER NOT NULL,
        current_latitude DECIMAL(10, 8) NOT NULL,
        current_longitude DECIMAL(11, 8) NOT NULL,
        heading DECIMAL(5, 2),
        speed DECIMAL(8, 2),
        accuracy DECIMAL(8, 2),
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Create delivery_routes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS delivery_routes (
        id SERIAL PRIMARY KEY,
        delivery_id INTEGER NOT NULL,
        pickup_latitude DECIMAL(10, 8) NOT NULL,
        pickup_longitude DECIMAL(11, 8) NOT NULL,
        delivery_latitude DECIMAL(10, 8) NOT NULL,
        delivery_longitude DECIMAL(11, 8) NOT NULL,
        route_geometry TEXT,
        distance_meters INTEGER NOT NULL,
        estimated_duration_seconds INTEGER NOT NULL,
        actual_duration_seconds INTEGER,
        traffic_info TEXT,
        here_route_id TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create delivery_status_history table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS delivery_status_history (
        id SERIAL PRIMARY KEY,
        delivery_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_by INTEGER,
        metadata TEXT
      )
    `);

    // Create websocket_sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS websocket_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        session_id TEXT NOT NULL UNIQUE,
        user_type TEXT NOT NULL,
        connected_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_activity TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      )
    `);

    console.log('✅ All delivery tracking tables created successfully');

    // Create sample data for testing
    console.log('Creating sample delivery tracking data...');
    
    // Insert sample location tracking data
    await db.execute(sql`
      INSERT INTO delivery_location_tracking (delivery_id, delivery_partner_id, current_latitude, current_longitude, heading, speed, accuracy, is_active)
      VALUES (7, 1, 26.4499, 80.3319, 45.0, 15.5, 5.0, true)
      ON CONFLICT DO NOTHING
    `);

    // Insert sample route data
    await db.execute(sql`
      INSERT INTO delivery_routes (delivery_id, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, distance_meters, estimated_duration_seconds, here_route_id)
      VALUES (7, 26.4499, 80.3319, 26.4700, 80.3500, 2500, 600, 'sample_route_123')
      ON CONFLICT DO NOTHING
    `);

    // Insert sample status history
    await db.execute(sql`
      INSERT INTO delivery_status_history (delivery_id, status, description, latitude, longitude, updated_by)
      VALUES 
        (7, 'assigned', 'Delivery partner assigned to order', 26.4499, 80.3319, 1),
        (7, 'en_route_pickup', 'On the way to pickup location', 26.4510, 80.3325, 1)
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Sample delivery tracking data created');
    
  } catch (error) {
    console.error('❌ Error setting up delivery tracking:', error);
    throw error;
  }
}

createDeliveryTrackingTables();