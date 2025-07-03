import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Production database URL (external server) - for deployment
const PRODUCTION_DATABASE_URL = "postgresql://mydreamv50:123456@139.59.19.202:5432/mydreamv50";

// Development environment database connection
// In development, we'll use the working database, but keep production config ready
const DATABASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.DATABASE_URL || PRODUCTION_DATABASE_URL)
  : (process.env.DATABASE_URL || "postgresql://neondb_owner:npg_8S1tihPQpDuH@ep-lucky-meadow-a8x292uf-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require");

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`🔌 Using database: ${DATABASE_URL.includes('mydreamv50') ? 'Production (External)' : 'Development'}`);

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });