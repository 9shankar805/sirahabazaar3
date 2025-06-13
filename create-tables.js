import { Pool } from 'pg';

async function createTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Creating basic tables...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        role TEXT NOT NULL DEFAULT 'customer',
        status TEXT NOT NULL DEFAULT 'active',
        approval_date TIMESTAMP,
        approved_by INTEGER,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create admin_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        is_active BOOLEAN DEFAULT true
      );
    `);

    // Create stores table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        owner_id INTEGER NOT NULL,
        address TEXT NOT NULL,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        phone TEXT,
        website TEXT,
        logo TEXT,
        cover_image TEXT,
        rating DECIMAL(3, 2) DEFAULT 0.00,
        total_reviews INTEGER DEFAULT 0,
        featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        store_type TEXT NOT NULL DEFAULT 'retail',
        cuisine_type TEXT,
        delivery_time TEXT,
        minimum_order DECIMAL(10, 2),
        delivery_fee DECIMAL(10, 2),
        is_delivery_available BOOLEAN DEFAULT false,
        opening_hours TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT NOT NULL DEFAULT 'package',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        category_id INTEGER,
        store_id INTEGER NOT NULL,
        stock INTEGER DEFAULT 0,
        image_url TEXT NOT NULL DEFAULT '',
        images TEXT[] DEFAULT '{}',
        rating DECIMAL(3, 2) DEFAULT 0.00,
        total_reviews INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_fast_sell BOOLEAN DEFAULT false,
        is_on_offer BOOLEAN DEFAULT false,
        offer_percentage INTEGER DEFAULT 0,
        offer_end_date TEXT,
        product_type TEXT NOT NULL DEFAULT 'retail',
        preparation_time TEXT,
        ingredients TEXT[] DEFAULT '{}',
        allergens TEXT[] DEFAULT '{}',
        spice_level TEXT,
        is_vegetarian BOOLEAN DEFAULT false,
        is_vegan BOOLEAN DEFAULT false,
        nutrition_info TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        shipping_address TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        phone TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create delivery_partners table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_partners (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        vehicle_type TEXT NOT NULL,
        vehicle_number TEXT NOT NULL,
        driving_license TEXT NOT NULL,
        id_proof_type TEXT NOT NULL,
        id_proof_number TEXT NOT NULL,
        delivery_areas TEXT[] DEFAULT '{}',
        emergency_contact TEXT NOT NULL,
        bank_account_number TEXT NOT NULL,
        ifsc_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        approved_by INTEGER,
        approval_date TIMESTAMP,
        rejection_reason TEXT,
        is_available BOOLEAN DEFAULT true,
        current_location TEXT,
        total_deliveries INTEGER DEFAULT 0,
        rating DECIMAL(3, 2) DEFAULT 0.00,
        total_earnings DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create deliveries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        delivery_partner_id INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        assigned_at TIMESTAMP,
        picked_up_at TIMESTAMP,
        delivered_at TIMESTAMP,
        delivery_fee DECIMAL(10, 2) NOT NULL,
        pickup_address TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        estimated_distance DECIMAL(8, 2),
        estimated_time INTEGER,
        actual_time INTEGER,
        special_instructions TEXT,
        proof_of_delivery TEXT,
        customer_rating INTEGER,
        customer_feedback TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create new tracking tables
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

    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createTables();