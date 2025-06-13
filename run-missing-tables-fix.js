
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('amazonaws') ? { rejectUnauthorized: false } : false
});

async function createMissingTables() {
  try {
    console.log('🔧 Creating missing database tables...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'fix-missing-tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Missing tables created successfully!');
    console.log('📋 Created tables:');
    console.log('   - support_tickets');
    console.log('   - wishlist_items');
    console.log('   - notifications');
    console.log('   - coupons');
    console.log('   - banners');
    console.log('   - Added necessary indexes');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createMissingTables();
