"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { profileSchema, type FormState } from "@/lib/validators";

export async function updateProfileAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireAuth();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const db = getDb();
  await db
    .update(profiles)
    .set({
      fullName: parsed.data.fullName,
      avatarUrl: parsed.data.avatarUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, session.profile.id));

  await createAuditLog({
    actorUserId: session.profile.id,
    actorEmail: session.profile.email,
    action: "UPDATE_PROFILE",
    targetTable: "profiles",
    targetId: session.profile.id,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: "Profile updated." };
}
