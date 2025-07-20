import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// PostgreSQL database URL - using Replit provided database or fallback
let DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://doadmin:show-password@db-postgresql-blr1-34567-do-user-23211066-0.d.db.ondigitalocean.com:25060/defaultdb";

// Remove any SSL requirements that might cause certificate issues
DATABASE_URL = DATABASE_URL.replace(/[?&]sslmode=[^&]+/g, '');
DATABASE_URL += DATABASE_URL.includes('?') ? '&sslmode=disable' : '?sslmode=disable';

console.log(`🔌 Using PostgreSQL database: ${DATABASE_URL ? 'Connected' : 'No URL found'}`);

// Determine SSL configuration - be more permissive for external databases
const isExternalDatabase = DATABASE_URL.includes('digitalocean') || DATABASE_URL.includes('neon') || DATABASE_URL.includes('amazonaws') || DATABASE_URL.includes('show-password');
const sslConfig = isExternalDatabase ? { 
  rejectUnauthorized: false,
  checkServerIdentity: () => undefined 
} : false;

// Enhanced pool configuration with SSL bypass
export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Connection limits
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,

  // Application name for monitoring
  application_name: "siraha_bazaar",
  statement_timeout: 60000,

  // Completely disable SSL verification
  ssl: false,

  // Performance tuning
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
});

// Enhanced error handling to prevent crashes
pool.on("error", (err: any, client) => {
  console.error("Unexpected database error:", err.message);

  // Handle specific error codes to prevent crashes
  if (err.code) {
    switch (err.code) {
      case "53300": // Too many connections
        console.error("CRITICAL: Too many database connections - cleaning up");
        break;
      case "53200": // Out of memory
        console.error("CRITICAL: Database out of memory");
        break;
      case "57P01": // Admin shutdown
        console.error("CRITICAL: Database was shut down");
        break;
      default:
        console.error(`Database error (${err.code}): ${err.message}`);
    }
  }
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
