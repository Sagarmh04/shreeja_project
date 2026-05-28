import type { AuditRecord } from "@/lib/types";

type AuditWithUser = AuditRecord & {
  user: {
    name: string;
    staff_id: string | null;
    role?: "admin" | "staff" | null;
  } | null;
};

export function formatAuditEventTitle(eventKey: string) {
  const titles: Record<string, string> = {
    auth_logged_in: "Signed in",
    auth_logged_out: "Signed out",
    staff_created: "Created staff member",
    staff_updated: "Updated staff profile",
    staff_activated: "Activated staff account",
    staff_deactivated: "Deactivated staff account",
    staff_profile_viewed: "Viewed staff profile",
    store_profile_viewed: "Viewed store profile",
    store_profile_updated: "Updated store profile",
    item_created: "Added catalog item",
    item_updated: "Updated catalog item",
    item_removed: "Removed catalog item",
    item_restored: "Restored catalog item",
    order_created: "Created order",
    order_viewed: "Viewed order details",
  };

  return titles[eventKey] ?? eventKey.replaceAll("_", " ");
}

function formatActorName(entry: AuditWithUser) {
  return entry.user?.name ?? "System";
}

function formatOrderReference(metadata: Record<string, unknown>) {
  const orderNumber = typeof metadata.order_number === "string" ? metadata.order_number : null;
  const customerName = typeof metadata.customer_name === "string" ? metadata.customer_name : null;

  if (orderNumber && customerName) {
    return `order ${orderNumber} for ${customerName}`;
  }

  if (orderNumber) {
    return `order ${orderNumber}`;
  }

  if (customerName) {
    return `order for ${customerName}`;
  }

  return "an order";
}

export function formatAuditHeadline(entry: AuditWithUser) {
  const actorName = formatActorName(entry);
  const metadata = (entry.event_metadata ?? {}) as Record<string, unknown>;
  const target = entry.entity_label ?? entry.change_on_label;

  switch (entry.event_key) {
    case "auth_logged_in":
      return `${actorName} signed in`;
    case "auth_logged_out":
      return `${actorName} signed out`;
    case "order_created":
      return `${actorName} created ${formatOrderReference(metadata)}`;
    case "order_viewed":
      return `${actorName} viewed ${formatOrderReference(metadata)}`;
    case "staff_created":
      return `${actorName} created a staff account for ${target ?? "a staff member"}`;
    case "staff_updated":
      if (entry.user_id && entry.entity_id && entry.user_id === entry.entity_id) {
        return `${actorName} updated their profile`;
      }

      return `${actorName} updated staff details for ${target ?? "a staff member"}`;
    case "staff_activated":
      return `${actorName} reactivated ${target ?? "a staff member"}`;
    case "staff_deactivated":
      return `${actorName} deactivated ${target ?? "a staff member"}`;
    case "staff_profile_viewed":
      if (entry.user_id && entry.entity_id && entry.user_id === entry.entity_id) {
        return `${actorName} viewed their profile`;
      }

      return `${actorName} viewed the profile for ${target ?? "a staff member"}`;
    case "store_profile_viewed":
      return `${actorName} viewed the store profile`;
    case "store_profile_updated":
      return `${actorName} updated the store profile`;
    case "item_created":
      return `${actorName} added ${target ?? "a catalog item"}`;
    case "item_updated":
      return `${actorName} updated ${target ?? "a catalog item"}`;
    case "item_removed":
      return `${actorName} removed ${target ?? "a catalog item"} from the catalog`;
    case "item_restored":
      return `${actorName} restored ${target ?? "a catalog item"} to the catalog`;
    default:
      return `${actorName} ${formatAuditEventTitle(entry.event_key).toLowerCase()}`;
  }
}

export function formatAuditMetaLine(entry: AuditWithUser) {
  const roleLabel = entry.user?.role === "admin" ? "Admin" : entry.user?.role === "staff" ? "Staff" : null;
  const parts = [roleLabel, entry.user?.staff_id].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "System event";
}

export function formatAuditEntityType(entityType: string | null) {
  const labels: Record<string, string> = {
    auth: "Auth",
    staff: "Staff",
    item: "Item",
    order: "Order",
    store: "Store",
  };

  return entityType ? (labels[entityType] ?? entityType) : null;
}

export function getAuditTargetHref(entry: AuditRecord) {
  switch (entry.entity_type) {
    case "order":
      return entry.entity_id ? `/admin/orders/${entry.entity_id}` : null;
    case "store":
      return "/admin/profile";
    case "staff":
      return entry.entity_id ? `/admin/staff?target=${entry.entity_id}` : "/admin/staff";
    case "item":
      return entry.entity_id ? `/admin/items?target=${entry.entity_id}` : "/admin/items";
    default:
      return null;
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getAuditDayLabel(timestamp: string) {
  const current = startOfDay(new Date());
  const target = startOfDay(new Date(timestamp));
  const diffDays = Math.round((current.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return target.toISOString();
}

export function groupAuditLogsByDay(entries: AuditWithUser[]) {
  const groups = new Map<string, AuditWithUser[]>();

  for (const entry of entries) {
    const label = getAuditDayLabel(entry.timestamp);
    const current = groups.get(label) ?? [];
    current.push(entry);
    groups.set(label, current);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}
