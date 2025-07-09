import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// PostgreSQL database URL - using Replit PostgreSQL database (original)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`🔌 Using Replit PostgreSQL database (original setup)`);

// Enhanced pool configuration for Replit PostgreSQL database
export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Connection limits optimized for Replit database
  max: 15,                    // Optimal for Replit environment
  min: 3,                     // Minimum connections
  idleTimeoutMillis: 30000,   // Keep connections alive
  connectionTimeoutMillis: 5000, // Connection timeout
  
  // PostgreSQL-specific optimizations
  application_name: 'siraha_bazaar_replit',
  statement_timeout: 30000,   // 30 second query timeout
  
  // SSL configuration for Replit (auto-configured)
  ssl: DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  
  // Performance tuning
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
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