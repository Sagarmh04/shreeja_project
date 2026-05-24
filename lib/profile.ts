import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { loginHistory, profiles } from "@/lib/db/schema";

export async function getRecentLogin(userId: string) {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId))
      .orderBy(desc(loginHistory.loginAt))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error("Failed to fetch recent login.", error);
    return null;
  }
}

export async function getProfileById(userId: string) {
  const db = getDb();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile ?? null;
}
