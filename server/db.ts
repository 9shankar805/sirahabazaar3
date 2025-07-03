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

console.log(`🔌 Using Replit PostgreSQL database`);

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });