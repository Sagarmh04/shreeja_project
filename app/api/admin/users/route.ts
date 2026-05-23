import { desc } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export async function GET() {
  await requireAdmin();

  const db = getDb();
  const users = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      isAdmin: profiles.isAdmin,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .orderBy(desc(profiles.createdAt));

  return Response.json({ users });
}
