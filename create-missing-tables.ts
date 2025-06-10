import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function createMissingTables() {
  try {
    console.log('Creating missing database tables...');
    
    // Create inventory_logs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        store_id INTEGER NOT NULL REFERENCES stores(id),
        type TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'adjustment')),
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL DEFAULT 0,
        new_stock INTEGER NOT NULL DEFAULT 0,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✓ Created inventory_logs table');
    
    // Create store_analytics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_analytics (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        date DATE NOT NULL,
        page_views INTEGER DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        product_views INTEGER DEFAULT 0,
        add_to_cart_count INTEGER DEFAULT 0,
        checkout_count INTEGER DEFAULT 0,
        orders_count INTEGER DEFAULT 0,
        revenue DECIMAL(10,2) DEFAULT 0,
        conversion_rate DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(store_id, date)
      )
    `);
    console.log('✓ Created store_analytics table');
    
    // Create indices for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_inventory_logs_store_id ON inventory_logs(store_id)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_store_analytics_store_date ON store_analytics(store_id, date)
    `);
    
    console.log('✓ Created database indices');
    console.log('Database tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

createMissingTables();