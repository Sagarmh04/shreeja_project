import { desc, eq, and, gte, lte, ilike } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { auditLogs, type AuditAction } from "@/lib/db/schema";

type AuditPayload = {
  actorUserId?: string | null;
  actorEmail: string;
  action: AuditAction;
  targetTable: string;
  targetId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function createAuditLog(payload: AuditPayload) {
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      actorUserId: payload.actorUserId ?? null,
      actorEmail: payload.actorEmail,
      action: payload.action,
      targetTable: payload.targetTable,
      targetId: payload.targetId ?? null,
      metadata: payload.metadata ?? {},
    });
  } catch (error) {
    console.error("Failed to create audit log.", error);
  }
}

export async function getAuditLogs(filters: {
  action?: string;
  user?: string;
  from?: string;
  to?: string;
}) {
  const db = getDb();
  const conditions = [];

  if (filters.action) {
    conditions.push(eq(auditLogs.action, filters.action as AuditAction));
  }

  if (filters.user) {
    conditions.push(ilike(auditLogs.actorEmail, `%${filters.user}%`));
  }

  if (filters.from) {
    conditions.push(gte(auditLogs.createdAt, new Date(filters.from)));
  }

  if (filters.to) {
    conditions.push(lte(auditLogs.createdAt, new Date(`${filters.to}T23:59:59`)));
  }

  return db
    .select()
    .from(auditLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(250);
}
