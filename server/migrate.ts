import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  try {
    console.log("Running database migrations...");

    // Create admin_users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Update stores table to ensure owner_id column exists
    await db.execute(sql`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) NOT NULL DEFAULT 1
    `);

    // Create delivery_partners table with correct schema
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS delivery_partners (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
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
        approved_by INTEGER REFERENCES users(id),
        approval_date TIMESTAMP,
        rejection_reason TEXT,
        is_available BOOLEAN DEFAULT true,
        current_location TEXT,
        total_deliveries INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_earnings DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create deliveries table with correct schema
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) NOT NULL,
        delivery_partner_id INTEGER REFERENCES delivery_partners(id),
        status TEXT NOT NULL DEFAULT 'pending',
        assigned_at TIMESTAMP,
        picked_up_at TIMESTAMP,
        delivered_at TIMESTAMP,
        delivery_fee DECIMAL(10,2) NOT NULL,
        pickup_address TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        estimated_distance DECIMAL(8,2),
        estimated_time INTEGER,
        actual_time INTEGER,
        special_instructions TEXT,
        proof_of_delivery TEXT,
        customer_rating INTEGER,
        customer_feedback TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create notifications table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Add icon column to categories table if missing
    await db.execute(sql`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'package'
    `);

    // Add description column to categories table if missing
    await db.execute(sql`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT
    `);

    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}