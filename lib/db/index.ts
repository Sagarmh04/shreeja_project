import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { requireServerEnv } from "@/lib/env";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    const connectionString = requireServerEnv("DATABASE_URL");
    const client = postgres(connectionString, {
      prepare: false,
    });
    dbInstance = drizzle(client);
  }

  return dbInstance;
}
