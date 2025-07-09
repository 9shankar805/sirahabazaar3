import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// PostgreSQL database URL - using external PostgreSQL database
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://mydreamv50:123456@139.59.19.202:5432/mydreamv50";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`🔌 Using external PostgreSQL database: ${DATABASE_URL?.split('@')[1]?.split('/')[0] || 'configured database'}`);

// Enhanced pool configuration for external PostgreSQL database
export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Connection limits optimized for external database
  max: 8,                     // Reduced for external database
  min: 1,                     // Minimum connections
  idleTimeoutMillis: 20000,   // Shorter timeout for external database
  connectionTimeoutMillis: 10000, // Allow time for external connection
  
  // PostgreSQL-specific optimizations
  application_name: 'siraha_bazaar_marketplace',
  statement_timeout: 25000,   // 25 second query timeout
  
  // SSL configuration for external database
  ssl: false, // External database doesn't require SSL
  
  // Performance tuning
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
});

// Enhanced error handling to prevent crashes
pool.on('error', (err: any, client) => {
  console.error('Unexpected database error:', err.message);
  
  // Handle specific error codes to prevent crashes
  if (err.code) {
    switch (err.code) {
      case '53300': // Too many connections
        console.error('CRITICAL: Too many database connections - cleaning up');
        break;
      case '53200': // Out of memory
        console.error('CRITICAL: Database out of memory');
        break;
      case '57P01': // Admin shutdown
        console.error('CRITICAL: Database was shut down');
        break;
      default:
        console.error(`Database error (${err.code}): ${err.message}`);
    }
  }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\nShutting down database connections...');
  try {
    await pool.end();
    console.log('Database connections closed gracefully');
  } catch (error: any) {
    console.error('Error during shutdown:', error?.message || error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down database connections...');
  try {
    await pool.end();
    console.log('Database connections closed gracefully');
  } catch (error: any) {
    console.error('Error during shutdown:', error?.message || error);
  }
  process.exit(0);
});

export const db = drizzle(pool, { schema });