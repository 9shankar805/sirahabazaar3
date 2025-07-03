import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// PostgreSQL database URL - using Replit's provided PostgreSQL database
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`🔌 Using Replit PostgreSQL database with crash prevention`);

// Enhanced pool configuration to prevent crashes
export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Connection limits to prevent overload
  max: 15,                    // Maximum connections (reduced from default 20)
  min: 2,                     // Keep minimum connections alive
  idleTimeoutMillis: 20000,   // Close idle connections after 20 seconds
  connectionTimeoutMillis: 3000, // Fast timeout to prevent hanging
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