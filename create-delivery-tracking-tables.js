import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createDeliveryTrackingTables() {
  try {
    console.log('Creating delivery tracking tables...');

    // Create delivery_location_tracking table
    await pool.query(`
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
      );
    `);
    console.log('✅ delivery_location_tracking table created');

    // Create delivery_routes table
    await pool.query(`
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
      );
    `);
    console.log('✅ delivery_routes table created');

    // Create delivery_status_history table
    await pool.query(`
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
      );
    `);
    console.log('✅ delivery_status_history table created');

    // Create websocket_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS websocket_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        session_id TEXT NOT NULL UNIQUE,
        user_type TEXT NOT NULL,
        connected_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_activity TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      );
    `);
    console.log('✅ websocket_sessions table created');

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_location_tracking_delivery_id 
      ON delivery_location_tracking(delivery_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_location_tracking_timestamp 
      ON delivery_location_tracking(timestamp DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_routes_delivery_id 
      ON delivery_routes(delivery_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_status_history_delivery_id 
      ON delivery_status_history(delivery_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_websocket_sessions_user_id 
      ON websocket_sessions(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_websocket_sessions_session_id 
      ON websocket_sessions(session_id);
    `);

    console.log('✅ Indexes created for performance optimization');

    // Update deliveries table to ensure it has proper columns
    await pool.query(`
      ALTER TABLE deliveries 
      ADD COLUMN IF NOT EXISTS pickup_latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS pickup_longitude DECIMAL(11, 8),
      ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11, 8);
    `);
    console.log('✅ Updated deliveries table with location columns');

    console.log('🎉 All delivery tracking tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating delivery tracking tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createDeliveryTrackingTables();