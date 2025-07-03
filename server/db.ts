import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// PostgreSQL database URL - using postgres database since mydreamv50 doesn't exist
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://mydreamv50:123456@139.59.19.202:5432/postgres";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`🔌 Using PostgreSQL database: mydreamv50@139.59.19.202:5432/postgres`);

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });