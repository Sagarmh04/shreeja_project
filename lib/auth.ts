import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppProfile, AppRole } from "@/lib/types";

type SessionContext = {
  user: User;
  profile: AppProfile | null;
  role: AppRole;
  isAdmin: boolean;
};

type AuthenticatedContext = SessionContext & {
  profile: AppProfile;
};

function getMissingProfileMessage() {
  return "Profile setup is incomplete. Run the SQL files in SUPABASE_SETUP and backfill the admin profile.";
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const isAdmin = user.email === env.adminEmail || profile?.role === "admin";

  return {
    user,
    profile: (profile as AppProfile | null) ?? null,
    role: isAdmin ? "admin" : "staff",
    isAdmin,
  };
}

export async function requireAuthenticatedContext(): Promise<AuthenticatedContext> {
  const context = await getSessionContext();

  if (!context) {
    redirect("/");
  }

  if (!context.profile) {
    redirect(`/?status=error&message=${encodeURIComponent(getMissingProfileMessage())}`);
  }

  if (!context.isAdmin && !context.profile.is_active) {
    redirect(`/?status=error&message=${encodeURIComponent("Your account is inactive. Contact the admin.")}`);
  }

  return context as AuthenticatedContext;
}

export async function requireAdminContext() {
  const context = await requireAuthenticatedContext();

  if (!context.isAdmin) {
    redirect("/staff");
  }

  return context;
}

export async function requireStaffContext() {
  const context = await requireAuthenticatedContext();

  if (context.isAdmin) {
    redirect("/admin");
  }

  return context;
}

export async function redirectSignedInUser() {
  const context = await getSessionContext();

  if (!context) {
    return;
  }

  if (context.isAdmin) {
    redirect("/admin");
  }

  if (!context.profile?.is_active) {
    redirect(`/?status=error&message=${encodeURIComponent("Your account is inactive. Contact the admin.")}`);
  }

  redirect("/staff");
}
