import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error:", err);
});

// Test connection immediately on startup
pool.query("SELECT 1").then(() => {
  console.log("✅ Neon DB is alive and connected!");
}).catch((err) => {
  console.error("❌ Neon DB connection failed:", err.message);
});

export const db = drizzle(pool, { schema });
export { pool };