import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// PostgreSQL database URL - DigitalOcean database
const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://doadmin:AVNS_3UkZ6PqedWGFkdV6amW@db-postgresql-blr1-34567-do-user-23211066-0.d.db.ondigitalocean.com:25060/defaultdb?sslmode=require";

// Ensure proper SSL mode for production
const finalDatabaseUrl = DATABASE_URL.includes('sslmode=') 
  ? DATABASE_URL 
  : `${DATABASE_URL}${DATABASE_URL.includes('?') ? '&' : '?'}sslmode=require`;

console.log(`🔌 Using PostgreSQL database: ${DATABASE_URL ? 'Connected' : 'No URL found'}`);

// Enhanced pool configuration for DigitalOcean PostgreSQL
export const pool = new Pool({
  connectionString: finalDatabaseUrl,
  // Optimized for DigitalOcean managed database
  max: 3, // Reduced for managed database limits
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,

  // Application name for monitoring
  application_name: "siraha_bazaar",
  statement_timeout: 30000,
  query_timeout: 25000,

  // SSL configuration - required for DigitalOcean
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require'
  },

  // Optimized reconnection settings for managed database
  keepAlive: true,
  keepAliveInitialDelayMillis: 2000,
  
  // Stability options for production
  allowExitOnIdle: true,
  maxUses: 1000, // Lower for managed database
});

// Enhanced error handling with automatic recovery
pool.on("error", (err: any, client) => {
  console.error("Database connection error:", err.message);

  // Handle specific error codes and attempt recovery
  if (err.code) {
    switch (err.code) {
      case "53300": // Too many connections
        console.error("⚠️ Too many connections - reducing pool size");
        break;
      case "53200": // Out of memory
        console.error("⚠️ Database memory issue - will retry");
        break;
      case "57P01": // Admin shutdown
        console.error("⚠️ Database connection terminated - reconnecting");
        setTimeout(() => {
          console.log("🔄 Attempting database reconnection...");
        }, 2000);
        break;
      case "ECONNRESET":
        console.error("⚠️ Connection reset - will reconnect automatically");
        break;
      case "ENOTFOUND":
        console.error("⚠️ Database host not found - check connection string");
        break;
      default:
        console.error(`⚠️ Database error (${err.code}): ${err.message}`);
    }
  }
});

// Connection event handlers
pool.on("connect", (client) => {
  console.log("✅ Database client connected");
});

pool.on("acquire", (client) => {
  console.log("🔗 Database client acquired from pool");
});

pool.on("remove", (client) => {
  console.log("➖ Database client removed from pool");
});

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("\nShutting down database connections...");
  try {
    await pool.end();
    console.log("Database connections closed gracefully");
  } catch (error: any) {
    console.error("Error during shutdown:", error?.message || error);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down database connections...");
  try {
    await pool.end();
    console.log("Database connections closed gracefully");
  } catch (error: any) {
    console.error("Error during shutdown:", error?.message || error);
  }
  process.exit(0);
});

export const db = drizzle(pool, { schema });
