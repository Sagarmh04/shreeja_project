"use server";

import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { loginHistory, profiles } from "@/lib/db/schema";
import { isAdminEmail } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authSchema, signupSchema, type FormState } from "@/lib/validators";

export async function loginAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { error: error?.message ?? "Unable to sign in right now." };
  }

  const db = getDb();
  await db.insert(loginHistory).values({ userId: data.user.id });

  await createAuditLog({
    actorUserId: data.user.id,
    actorEmail: data.user.email ?? parsed.data.email,
    action: "LOGIN",
    targetTable: "auth.users",
    targetId: data.user.id,
  });

  revalidatePath("/", "layout");
  redirect(isAdminEmail(data.user.email ?? "") ? "/admin" : "/dashboard");
}

export async function signupAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Unable to create your account." };
  }

  const db = getDb();
  const admin = isAdminEmail(parsed.data.email);
  await db.insert(profiles).values({
    id: data.user.id,
    email: parsed.data.email,
    fullName: parsed.data.fullName,
    isAdmin: admin,
  });

  await db.insert(loginHistory).values({ userId: data.user.id });

  await createAuditLog({
    actorUserId: data.user.id,
    actorEmail: parsed.data.email,
    action: "SIGNUP",
    targetTable: "profiles",
    targetId: data.user.id,
  });

  revalidatePath("/", "layout");
  redirect(admin ? "/admin" : "/dashboard");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    const db = getDb();
    const [session] = await db
      .select()
      .from(loginHistory)
      .where(and(eq(loginHistory.userId, user.id), isNull(loginHistory.logoutAt)))
      .limit(1);

    if (session) {
      await db
        .update(loginHistory)
        .set({ logoutAt: new Date() })
        .where(eq(loginHistory.id, session.id));
    }

    await createAuditLog({
      actorUserId: user.id,
      actorEmail: user.email ?? "unknown@example.com",
      action: "LOGOUT",
      targetTable: "auth.users",
      targetId: user.id,
    });
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
