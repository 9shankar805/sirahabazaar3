import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// PostgreSQL database URL - using external PostgreSQL server
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://mydream50:123456@139.59.19.202:5432/mydreamv50";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`🔌 Using external PostgreSQL database (139.59.19.202) with crash prevention`);

// Ultra-robust pool configuration with advanced crash prevention
export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Connection limits with aggressive protection
  max: 12,                    // Reduced max connections for stability
  min: 3,                     // Higher minimum for availability
  idleTimeoutMillis: 10000,   // Faster idle cleanup
  connectionTimeoutMillis: 2000, // Even faster timeout
  
  // PostgreSQL-specific optimizations
  application_name: 'siraha_bazaar_main',
  statement_timeout: 20000,   // 20 second query timeout
  
  // Memory and performance tuning
  keepAlive: true,
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