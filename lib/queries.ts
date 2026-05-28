import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AppProfile,
  AuditRecord,
  ItemRecord,
  OrderItemRecord,
  OrderRecord,
  StoreProfile,
} from "@/lib/types";

type OrderWithStaff = OrderRecord & {
  ordered_by: Pick<AppProfile, "name" | "staff_id" | "phone"> | null;
};

type AuditWithUser = AuditRecord & {
  user: Pick<AppProfile, "name" | "staff_id" | "role"> | null;
};

async function getSupabase() {
  return createServerSupabaseClient();
}

export async function getStoreProfile() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("store_profile").select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return data as StoreProfile;
}

export async function getItems(includeInactive = true) {
  const supabase = await getSupabase();
  let query = supabase.from("items").select("*").order("is_active", { ascending: false }).order("name");

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ItemRecord[];
}

export async function getStaffMembers() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "staff")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AppProfile[];
}

export async function getAuditLogs(limit = 100) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, user:profiles!audit_logs_user_id_fkey(name, staff_id, role)")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AuditWithUser[];
}

export async function getOrdersForAdmin(limit = 50) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*, ordered_by:profiles!orders_ordered_by_user_id_fkey(name, staff_id, phone)")
    .order("ordered_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OrderWithStaff[];
}

export async function getAllOrdersForAdmin() {
  return getOrdersForAdmin(200);
}

export async function getOrdersForStaff(profileId: string, limit = 50) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*, ordered_by:profiles!orders_ordered_by_user_id_fkey(name, staff_id, phone)")
    .eq("ordered_by_user_id", profileId)
    .order("ordered_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OrderWithStaff[];
}

export async function getOrderDetail(orderId: string) {
  const supabase = await getSupabase();
  const [{ data: order, error: orderError }, { data: orderItems, error: itemError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*, ordered_by:profiles!orders_ordered_by_user_id_fkey(name, staff_id, phone)")
        .eq("id", orderId)
        .single(),
      supabase.from("order_items").select("*").eq("order_id", orderId).order("item_name"),
    ]);

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (itemError) {
    throw new Error(itemError.message);
  }

  return {
    order: order as OrderWithStaff,
    orderItems: (orderItems ?? []) as OrderItemRecord[],
  };
}
