import { Pool } from 'pg';

async function createReviewsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Creating product_reviews table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS product_reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        customer_id INTEGER NOT NULL REFERENCES users(id),
        order_id INTEGER REFERENCES orders(id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title TEXT,
        comment TEXT,
        images TEXT[] DEFAULT '{}',
        is_verified_purchase BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT TRUE,
        helpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ product_reviews table created successfully');
    
    // Create index for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);',
      'CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id ON product_reviews(customer_id);',
      'CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);'
    ];
    
    for (const query of indexQueries) {
      await pool.query(query);
    }
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await pool.end();
  }
}

createReviewsTable();