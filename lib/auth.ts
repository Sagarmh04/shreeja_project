import type { User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

function getProfileName(user: User, fallbackFullName?: string | null) {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";

  const fullName = fallbackFullName?.trim() || metadataName.trim();
  if (fullName) {
    return fullName;
  }

  const emailName = user.email?.split("@")[0]?.trim();
  return emailName || "Member";
}

export async function ensureProfileForUser(
  user: User,
  options?: { fallbackFullName?: string | null },
) {
  const db = getDb();
  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (existingProfile) {
    return existingProfile;
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("Authenticated user is missing an email address.");
  }

  const [profile] = await db
    .insert(profiles)
    .values({
      id: user.id,
      email,
      fullName: getProfileName(user, options?.fallbackFullName),
      isAdmin: isAdminEmail(email),
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        email,
        fullName: getProfileName(user, options?.fallbackFullName),
        isAdmin: isAdminEmail(email),
        updatedAt: new Date(),
      },
    })
    .returning();

  return profile;
}

export async function getCurrentProfile() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  return ensureProfileForUser(user);
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await ensureProfileForUser(user);

  return { user, profile };
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!session.profile.isAdmin) {
    redirect("/dashboard");
  }

  return session;
}

export function isAdminEmail(email: string) {
  return env.adminEmails.includes(email.trim().toLowerCase());
}
