export type AppRole = "admin" | "staff";

export type AppProfile = {
  id: string;
  auth_user_id: string;
  role: AppRole;
  name: string;
  staff_id: string | null;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StoreProfile = {
  id: string;
  store_name: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type ItemRecord = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderRecord = {
  id: string;
  customer_name: string;
  customer_phone: string;
  ordered_by_user_id: string;
  ordered_at: string;
  order_number: string;
  total_discount: number;
  total_price: number;
};

export type OrderItemRecord = {
  id: string;
  order_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type AuditRecord = {
  id: string;
  timestamp: string;
  user_id: string | null;
  change_type: string;
  change_on_id: string | null;
  change_on_label: string | null;
  from_value: Record<string, unknown> | null;
  to_value: Record<string, unknown> | null;
};
