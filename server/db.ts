import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_8S1tihPQpDuH@ep-lucky-meadow-a8x292uf-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });