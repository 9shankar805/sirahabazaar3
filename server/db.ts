import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// PostgreSQL database URL - your external server
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://mydreamv50:123456@139.59.19.202:5432/mydreamv50";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`🔌 Using PostgreSQL database: mydreamv50@139.59.19.202:5432`);

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });