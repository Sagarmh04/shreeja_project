"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { insertAuditLog, pickChangedFields } from "@/lib/audit";
import { requireAdminContext, requireAuthenticatedContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppProfile, ItemRecord, StoreProfile } from "@/lib/types";

function buildAuditChangeEntries(
  fromValue: Record<string, unknown> | null,
  toValue: Record<string, unknown> | null,
) {
  const keys = Array.from(
    new Set([...Object.keys(fromValue ?? {}), ...Object.keys(toValue ?? {})]),
  );

  return keys.map((field) => ({
    field,
    from: fromValue?.[field] ?? null,
    to: toValue?.[field] ?? null,
  }));
}

function buildStatusMetadata(fromActive: boolean, toActive: boolean) {
  return {
    status_from: fromActive,
    status_to: toActive,
  };
}

function redirectWithMessage(path: string, status: "success" | "error", message: string) {
  const params = new URLSearchParams({ status, message });
  redirect(`${path}?${params.toString()}`);
}

function rethrowIfRedirectError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  ) {
    throw error;
  }
}

function parseRequiredString(value: FormDataEntryValue | null, label: string) {
  const parsed = typeof value === "string" ? value.trim() : "";

  if (!parsed) {
    throw new Error(`${label} is required.`);
  }

  return parsed;
}

function parseMoney(value: FormDataEntryValue | null, label: string) {
  const parsed = Number(typeof value === "string" ? value : "");

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid amount.`);
  }

  return Number(parsed.toFixed(2));
}

async function getAdminAuditActor() {
  const context = await requireAdminContext();

  if (!context.profile) {
    throw new Error("Admin profile is missing.");
  }

  return context.profile;
}

export async function signInAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const email = parseRequiredString(formData.get("email"), "Email");
  const password = parseRequiredString(formData.get("password"), "Password");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithMessage("/", "error", "Invalid email or password.");
  }

  if (!data.user) {
    redirectWithMessage("/", "error", "Unable to resolve the signed-in user.");
  }

  const signedInUser = data.user!;

  const adminClient = createAdminSupabaseClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("auth_user_id", signedInUser.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    redirectWithMessage("/", "error", "Profile setup is incomplete. Run the SQL setup files first.");
  }

  if (profile.role !== "admin" && !profile.is_active) {
    await supabase.auth.signOut();
    redirectWithMessage("/", "error", "Your account is inactive. Contact the admin.");
  }

  await insertAuditLog({
    userId: profile.id,
    eventKey: "auth_logged_in",
    changeType: "logged in",
    entityType: "auth",
    eventMetadata: {
      actor_name: profile.name,
      actor_role: profile.role,
      staff_id: profile.staff_id,
    },
  });

  redirect(profile.role === "admin" ? "/admin" : "/staff");
}

export async function signOutAction() {
  const context = await requireAuthenticatedContext();
  const supabase = await createServerSupabaseClient();

  if (context.profile) {
    await insertAuditLog({
      userId: context.profile.id,
      eventKey: "auth_logged_out",
      changeType: "logged out",
      entityType: "auth",
      eventMetadata: {
        actor_name: context.profile.name,
        actor_role: context.profile.role,
        staff_id: context.profile.staff_id,
      },
    });
  }

  await supabase.auth.signOut();
  redirect("/");
}

export async function createStaffAction(formData: FormData) {
  try {
    const actor = await getAdminAuditActor();
    const adminClient = createAdminSupabaseClient();
    const name = parseRequiredString(formData.get("name"), "Name");
    const staffId = parseRequiredString(formData.get("staffId"), "Staff ID");
    const phone = parseRequiredString(formData.get("phone"), "Phone");
    const email = parseRequiredString(formData.get("email"), "Email").toLowerCase();
    const password = parseRequiredString(formData.get("password"), "Temporary password");

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        staff_id: staffId,
        phone,
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? "Unable to create staff account.");
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("auth_user_id", data.user.id)
      .single();

    await insertAuditLog({
      userId: actor.id,
      eventKey: "staff_created",
      changeType: "staff create",
      entityType: "staff",
      entityId: profile.id,
      entityLabel: profile.name,
      changeOnId: profile.id,
      changeOnLabel: profile.name,
      eventMetadata: {
        snapshot: {
          name: profile.name,
          staff_id: profile.staff_id,
          phone: profile.phone,
          email: profile.email,
          is_active: profile.is_active,
        },
        actor_role: actor.role,
      },
      toValue: {
        name: profile.name,
        staff_id: profile.staff_id,
        phone: profile.phone,
        email: profile.email,
        is_active: profile.is_active,
      },
    });

    revalidatePath("/admin/staff");
    revalidatePath("/admin");
    redirectWithMessage("/admin/staff", "success", "Staff account created. Share the temporary password privately.");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirectWithMessage(
      "/admin/staff",
      "error",
      error instanceof Error ? error.message : "Unable to create staff account.",
    );
  }
}

export async function updateStaffAction(formData: FormData) {
  try {
    const actor = await getAdminAuditActor();
    const supabase = await createServerSupabaseClient();
    const profileId = parseRequiredString(formData.get("profileId"), "Profile ID");

    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (existingError || !existing) {
      throw new Error("Staff record not found.");
    }

    const updates = {
      name: parseRequiredString(formData.get("name"), "Name"),
      staff_id: parseRequiredString(formData.get("staffId"), "Staff ID"),
      phone: parseRequiredString(formData.get("phone"), "Phone"),
    };

    const { error } = await supabase.from("profiles").update(updates).eq("id", profileId);

    if (error) {
      throw new Error(error.message);
    }

    const changed = pickChangedFields(
      existing as AppProfile,
      { ...(existing as AppProfile), ...updates },
      ["name", "staff_id", "phone"],
    );

    if (changed.fromValue || changed.toValue) {
      await insertAuditLog({
        userId: actor.id,
        eventKey: "staff_updated",
        changeType: "staff edit",
        entityType: "staff",
        entityId: profileId,
        entityLabel: updates.name,
        changeOnId: profileId,
        changeOnLabel: updates.name,
        eventMetadata: {
          snapshot: {
            name: updates.name,
            staff_id: updates.staff_id,
            phone: updates.phone,
            email: existing.email,
          },
          actor_role: actor.role,
          changes: buildAuditChangeEntries(changed.fromValue, changed.toValue),
        },
        fromValue: changed.fromValue,
        toValue: changed.toValue,
      });
    }

    revalidatePath("/admin/staff");
    redirectWithMessage("/admin/staff", "success", "Staff details updated.");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirectWithMessage(
      "/admin/staff",
      "error",
      error instanceof Error ? error.message : "Unable to update staff details.",
    );
  }
}

export async function toggleStaffStatusAction(formData: FormData) {
  try {
    const actor = await getAdminAuditActor();
    const supabase = await createServerSupabaseClient();
    const adminClient = createAdminSupabaseClient();
    const profileId = parseRequiredString(formData.get("profileId"), "Profile ID");
    const nextActive = formData.get("nextActive") === "true";

    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (existingError || !existing) {
      throw new Error("Staff record not found.");
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_active: nextActive })
      .eq("id", profileId);

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(existing.auth_user_id, {
      ban_duration: nextActive ? "none" : "876000h",
    });

    if (authError) {
      throw new Error(authError.message);
    }

    await insertAuditLog({
      userId: actor.id,
      eventKey: nextActive ? "staff_activated" : "staff_deactivated",
      changeType: nextActive ? "staff activate" : "staff deactivate",
      entityType: "staff",
      entityId: profileId,
      entityLabel: existing.name,
      changeOnId: profileId,
      changeOnLabel: existing.name,
      eventMetadata: {
        snapshot: {
          name: existing.name,
          staff_id: existing.staff_id,
          phone: existing.phone,
        },
        actor_role: actor.role,
        ...buildStatusMetadata(existing.is_active, nextActive),
      },
      fromValue: { is_active: existing.is_active },
      toValue: { is_active: nextActive },
    });

    revalidatePath("/admin/staff");
    redirectWithMessage(
      "/admin/staff",
      "success",
      nextActive ? "Staff member reactivated." : "Staff member deactivated.",
    );
  } catch (error) {
    rethrowIfRedirectError(error);
    redirectWithMessage(
      "/admin/staff",
      "error",
      error instanceof Error ? error.message : "Unable to update staff status.",
    );
  }
}

export async function createItemAction(formData: FormData) {
  try {
    const actor = await getAdminAuditActor();
    const supabase = await createServerSupabaseClient();
    const payload = {
      name: parseRequiredString(formData.get("name"), "Item name"),
      price: parseMoney(formData.get("price"), "Price"),
      is_active: true,
    };

    const { data, error } = await supabase.from("items").insert(payload).select("*").single();

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to create item.");
    }

    await insertAuditLog({
      userId: actor.id,
      eventKey: "item_created",
      changeType: "item added",
      entityType: "item",
      entityId: data.id,
      entityLabel: data.name,
      changeOnId: data.id,
      changeOnLabel: data.name,
      eventMetadata: {
        snapshot: {
          name: data.name,
          price: data.price,
          is_active: data.is_active,
        },
        actor_role: actor.role,
      },
      toValue: {
        name: data.name,
        price: data.price,
        is_active: data.is_active,
      },
    });

    revalidatePath("/admin/items");
    revalidatePath("/staff");
    redirectWithMessage("/admin/items", "success", "Item created.");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirectWithMessage(
      "/admin/items",
      "error",
      error instanceof Error ? error.message : "Unable to create item.",
    );
  }
}

export async function updateItemAction(formData: FormData) {
  try {
    const actor = await getAdminAuditActor();
    const supabase = await createServerSupabaseClient();
    const itemId = parseRequiredString(formData.get("itemId"), "Item ID");

    const { data: existing, error: existingError } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (existingError || !existing) {
      throw new Error("Item not found.");
    }

    const updates = {
      name: parseRequiredString(formData.get("name"), "Item name"),
      price: parseMoney(formData.get("price"), "Price"),
    };

    const { error } = await supabase.from("items").update(updates).eq("id", itemId);

    if (error) {
      throw new Error(error.message);
    }

    const changed = pickChangedFields(
      existing as ItemRecord,
      { ...(existing as ItemRecord), ...updates },
      ["name", "price"],
    );

    if (changed.fromValue || changed.toValue) {
      await insertAuditLog({
        userId: actor.id,
        eventKey: "item_updated",
        changeType: "item edited",
        entityType: "item",
        entityId: itemId,
        entityLabel: updates.name,
        changeOnId: itemId,
        changeOnLabel: updates.name,
        eventMetadata: {
          snapshot: {
            name: updates.name,
            price: updates.price,
            is_active: existing.is_active,
          },
          actor_role: actor.role,
          changes: buildAuditChangeEntries(changed.fromValue, changed.toValue),
        },
        fromValue: changed.fromValue,
        toValue: changed.toValue,
      });
    }

    revalidatePath("/admin/items");
    revalidatePath("/staff");
    redirectWithMessage("/admin/items", "success", "Item updated.");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirectWithMessage(
      "/admin/items",
      "error",
      error instanceof Error ? error.message : "Unable to update item.",
    );
  }
}

export async function toggleItemStatusAction(formData: FormData) {
  try {
    const actor = await getAdminAuditActor();
    const supabase = await createServerSupabaseClient();
    const itemId = parseRequiredString(formData.get("itemId"), "Item ID");
    const nextActive = formData.get("nextActive") === "true";

    const { data: existing, error: existingError } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (existingError || !existing) {
      throw new Error("Item not found.");
    }

    const { error } = await supabase.from("items").update({ is_active: nextActive }).eq("id", itemId);

    if (error) {
      throw new Error(error.message);
    }

    await insertAuditLog({
      userId: actor.id,
      eventKey: nextActive ? "item_restored" : "item_removed",
      changeType: nextActive ? "item restored" : "item removed",
      entityType: "item",
      entityId: itemId,
      entityLabel: existing.name,
      changeOnId: itemId,
      changeOnLabel: existing.name,
      eventMetadata: {
        snapshot: {
          name: existing.name,
          price: existing.price,
        },
        actor_role: actor.role,
        ...buildStatusMetadata(existing.is_active, nextActive),
      },
      fromValue: { is_active: existing.is_active },
      toValue: { is_active: nextActive },
    });

    revalidatePath("/admin/items");
    revalidatePath("/staff");
    redirectWithMessage(
      "/admin/items",
      "success",
      nextActive ? "Item restored." : "Item removed from the active catalog.",
    );
  } catch (error) {
    rethrowIfRedirectError(error);
    redirectWithMessage(
      "/admin/items",
      "error",
      error instanceof Error ? error.message : "Unable to update item status.",
    );
  }
}

export async function updateStoreProfileAction(formData: FormData) {
  try {
    const actor = await getAdminAuditActor();
    const supabase = await createServerSupabaseClient();

    const { data: existing, error: existingError } = await supabase
      .from("store_profile")
      .select("*")
      .single();

    if (existingError || !existing) {
      throw new Error("Store profile not found.");
    }

    const updates = {
      store_name: parseRequiredString(formData.get("storeName"), "Store name"),
      phone: parseRequiredString(formData.get("phone"), "Phone"),
      address: parseRequiredString(formData.get("address"), "Address"),
    };

    const { error } = await supabase.from("store_profile").update(updates).eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }

    const changed = pickChangedFields(
      existing as StoreProfile,
      { ...(existing as StoreProfile), ...updates },
      ["store_name", "phone", "address"],
    );

    if (changed.fromValue || changed.toValue) {
      await insertAuditLog({
        userId: actor.id,
        eventKey: "store_profile_updated",
        changeType: "profile edit",
        entityType: "store",
        entityId: existing.id,
        entityLabel: updates.store_name,
        changeOnId: existing.id,
        changeOnLabel: updates.store_name,
        eventMetadata: {
          snapshot: {
            store_name: updates.store_name,
            phone: updates.phone,
            address: updates.address,
          },
          actor_role: actor.role,
          changes: buildAuditChangeEntries(changed.fromValue, changed.toValue),
        },
        fromValue: changed.fromValue,
        toValue: changed.toValue,
      });
    }

    revalidatePath("/admin/profile");
    redirectWithMessage("/admin/profile", "success", "Store profile updated.");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirectWithMessage(
      "/admin/profile",
      "error",
      error instanceof Error ? error.message : "Unable to update store profile.",
    );
  }
}

export async function updateOwnProfileAction(formData: FormData) {
  try {
    const context = await requireAuthenticatedContext();
    const supabase = await createServerSupabaseClient();

    if (!context.profile) {
      throw new Error("Profile not found.");
    }

    const updates = {
      name: parseRequiredString(formData.get("name"), "Name"),
      phone: parseRequiredString(formData.get("phone"), "Phone"),
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", context.profile.id);

    if (error) {
      throw new Error(error.message);
    }

    const changed = pickChangedFields(
      context.profile as AppProfile,
      { ...(context.profile as AppProfile), ...updates },
      ["name", "phone"],
    );

    if (changed.fromValue || changed.toValue) {
      await insertAuditLog({
        userId: context.profile.id,
        eventKey: "staff_updated",
        changeType: "profile edit",
        entityType: "staff",
        entityId: context.profile.id,
        entityLabel: updates.name,
        changeOnId: context.profile.id,
        changeOnLabel: updates.name,
        eventMetadata: {
          snapshot: {
            name: updates.name,
            staff_id: context.profile.staff_id,
            phone: updates.phone,
            email: context.profile.email,
          },
          actor_role: context.profile.role,
          changes: buildAuditChangeEntries(changed.fromValue, changed.toValue),
        },
        fromValue: changed.fromValue,
        toValue: changed.toValue,
      });
    }

    revalidatePath("/staff/profile");
    redirectWithMessage("/staff/profile", "success", "Profile updated.");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirectWithMessage(
      "/staff/profile",
      "error",
      error instanceof Error ? error.message : "Unable to update your profile.",
    );
  }
}

export async function createOrderAction(formData: FormData) {
  try {
    const context = await requireAuthenticatedContext();
    const adminClient = createAdminSupabaseClient();

    if (!context.profile) {
      throw new Error("Profile not found.");
    }

    const customerName = parseRequiredString(formData.get("customerName"), "Customer name");
    const customerPhone = parseRequiredString(formData.get("customerPhone"), "Customer phone");
    const totalDiscount = parseMoney(formData.get("totalDiscount"), "Discount");
    const itemIds = formData
      .getAll("itemId")
      .map((value) => (typeof value === "string" ? value : ""))
      .filter(Boolean);
    const quantities = formData
      .getAll("quantity")
      .map((value) => Number(typeof value === "string" ? value : ""));

    if (itemIds.length === 0) {
      throw new Error("Add at least one item to the order.");
    }

    if (itemIds.length !== quantities.length) {
      throw new Error("Order rows are incomplete.");
    }

    const { data: items, error: itemsError } = await adminClient
      .from("items")
      .select("*")
      .in("id", itemIds)
      .eq("is_active", true);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    const itemMap = new Map((items ?? []).map((item) => [item.id, item as ItemRecord]));
    const orderLineItems = itemIds.map((itemId, index) => {
      const item = itemMap.get(itemId);
      const quantity = Number(quantities[index]);

      if (!item) {
        throw new Error("One or more selected items are no longer available.");
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Each order item must have a valid quantity.");
      }

      const lineTotal = Number((item.price * quantity).toFixed(2));

      return {
        item_id: item.id,
        item_name: item.name,
        quantity,
        unit_price: item.price,
        total_price: lineTotal,
      };
    });

    const subtotal = orderLineItems.reduce((sum, item) => sum + item.total_price, 0);

    if (totalDiscount > subtotal) {
      throw new Error("Discount cannot be greater than the order subtotal.");
    }

    const totalPrice = Number((subtotal - totalDiscount).toFixed(2));

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        ordered_by_user_id: context.profile.id,
        total_discount: totalDiscount,
        total_price: totalPrice,
      })
      .select("*")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? "Unable to create order.");
    }

    const { error: orderItemsError } = await adminClient.from("order_items").insert(
      orderLineItems.map((item) => ({
        order_id: order.id,
        ...item,
      })),
    );

    if (orderItemsError) {
      await adminClient.from("orders").delete().eq("id", order.id);
      throw new Error(orderItemsError.message);
    }

    await insertAuditLog({
      userId: context.profile.id,
      eventKey: "order_created",
      changeType: "order created",
      entityType: "order",
      entityId: order.id,
      entityLabel: customerName,
      changeOnId: order.id,
      changeOnLabel: customerName,
      eventMetadata: {
        order_number: order.order_number,
        customer_name: customerName,
        customer_phone: customerPhone,
        ordered_by_name: context.profile.name,
        ordered_by_staff_id: context.profile.staff_id,
        ordered_by_role: context.profile.role,
        item_count: orderLineItems.length,
        subtotal,
        total_discount: totalDiscount,
        final_total: totalPrice,
        items: orderLineItems.map((item) => ({
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
      },
      toValue: {
        order_number: order.order_number,
        customer_name: customerName,
        total_price: totalPrice,
      },
    });

    revalidatePath("/staff");
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    redirectWithMessage("/staff", "success", `Order ${order.order_number} created successfully.`);
  } catch (error) {
    rethrowIfRedirectError(error);
    redirectWithMessage(
      "/staff",
      "error",
      error instanceof Error ? error.message : "Unable to create order.",
    );
  }
}
