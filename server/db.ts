import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// PostgreSQL database URL - using provided DigitalOcean database
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://doadmin:AVNS_3UkZ6PqedWGFkdV6amW@db-postgresql-blr1-34567-do-user-23211066-0.d.db.ondigitalocean.com:25060/defaultdb?sslmode=require";

console.log(`🔌 Using PostgreSQL database: ${DATABASE_URL ? 'Connected' : 'No URL found'}`);

// Enhanced pool configuration for DigitalOcean database
export const pool = new Pool({
  connectionString: DATABASE_URL,
  // Connection limits
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,

  // Application name for monitoring
  application_name: "siraha_bazaar",
  statement_timeout: 30000,

  // SSL configuration for DigitalOcean
  ssl: {
    rejectUnauthorized: false
  },

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
