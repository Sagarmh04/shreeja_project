import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AuditPayload = {
  userId: string;
  eventKey: string;
  changeType: string;
  entityType?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  changeOnId?: string | null;
  changeOnLabel?: string | null;
  eventMetadata?: Record<string, unknown> | null;
  fromValue?: Record<string, unknown> | null;
  toValue?: Record<string, unknown> | null;
};

export function pickChangedFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: Array<keyof T>,
) {
  const fromValue: Record<string, unknown> = {};
  const toValue: Record<string, unknown> = {};

  for (const field of fields) {
    if (before[field] !== after[field]) {
      fromValue[String(field)] = before[field];
      toValue[String(field)] = after[field];
    }
  }

  return {
    fromValue: Object.keys(fromValue).length > 0 ? fromValue : null,
    toValue: Object.keys(toValue).length > 0 ? toValue : null,
  };
}

export async function insertAuditLog({
  userId,
  eventKey,
  changeType,
  entityType,
  entityId,
  entityLabel,
  changeOnId,
  changeOnLabel,
  eventMetadata,
  fromValue,
  toValue,
}: AuditPayload) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from("audit_logs").insert({
    user_id: userId,
    event_key: eventKey,
    change_type: changeType,
    entity_type: entityType ?? null,
    entity_id: entityId ?? changeOnId ?? null,
    entity_label: entityLabel ?? changeOnLabel ?? null,
    change_on_id: changeOnId ?? null,
    change_on_label: changeOnLabel ?? null,
    event_metadata: eventMetadata ?? null,
    from_value: fromValue ?? null,
    to_value: toValue ?? null,
  });

  if (error) {
    console.error("Failed to write audit log", error.message);
  }
}
