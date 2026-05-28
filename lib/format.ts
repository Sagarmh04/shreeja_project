export const APP_TIME_ZONE = "Asia/Kolkata";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

export function formatAuditJson(value: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) {
    return "-";
  }

  return JSON.stringify(value);
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function formatAuditTarget(value: string | null) {
  if (!value || uuidPattern.test(value)) {
    return "-";
  }

  return value;
}

const auditFieldLabels: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  staff_id: "Staff ID",
  is_active: "Status",
  store_name: "Store name",
  address: "Address",
  price: "Price",
  item_name: "Item name",
  total_price: "Total price",
  total_discount: "Discount",
  customer_name: "Customer name",
  customer_phone: "Customer phone",
  order_number: "Order number",
};

export function formatAuditFieldLabel(key: string) {
  return (
    auditFieldLabels[key] ??
    key
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

const currencyFields = new Set([
  "price",
  "unit_price",
  "total_price",
  "total_discount",
  "subtotal",
  "final_total",
]);

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Active" : "Inactive";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => formatAuditValue(entry)).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function formatAuditFieldValue(field: string, value: unknown): string {
  if (currencyFields.has(field) && typeof value === "number") {
    return formatCurrency(value);
  }

  return formatAuditValue(value);
}
