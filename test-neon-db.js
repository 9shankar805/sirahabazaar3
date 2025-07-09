#!/usr/bin/env node

/**
 * Test Neon Database Connection
 * Checks if the provided Neon database URL is accessible
 */

import { Pool } from 'pg';

const neonDbUrl = 'postgresql://neondb_owner:npg_8S1tihPQpDuH@ep-lucky-meadow-a8x292uf-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function testNeonConnection() {
  console.log('🔍 Testing Neon database connection...');
  console.log('Database URL:', neonDbUrl.split('@')[1]); // Hide credentials
  
  const pool = new Pool({
    connectionString: neonDbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 1
  });
  
  try {
    const client = await pool.connect();
    console.log('✓ Connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT current_database(), version(), now()');
    console.log('\nDatabase Info:');
    console.log('  Database:', result.rows[0].current_database);
    console.log('  Version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    console.log('  Current Time:', result.rows[0].now);
    
    // Check if it's a Replit database or external
    const hostInfo = await client.query('SELECT inet_server_addr(), inet_server_port()');
    console.log('\nConnection Details:');
    console.log('  Server IP:', hostInfo.rows[0].inet_server_addr);
    console.log('  Server Port:', hostInfo.rows[0].inet_server_port);
    
    // Check database schema
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\nExisting Tables:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log('  -', row.table_name);
      });
    } else {
      console.log('  No tables found');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✓ Database connection test completed successfully');
    
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Possible issues:');
      console.log('  - Network connectivity problems');
      console.log('  - Database server is down');
      console.log('  - Connection pooling limits reached');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Possible issues:');
      console.log('  - Invalid credentials');
      console.log('  - Database user permissions');
    }
    
    process.exit(1);
  }
}

testNeonConnection();