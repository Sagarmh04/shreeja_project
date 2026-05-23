import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { personalRecords, recordAttachments } from "@/lib/db/schema";

export async function getUserRecords(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.userId, userId))
    .orderBy(desc(personalRecords.updatedAt));
}

export async function getRecordById(recordId: string, userId: string) {
  const db = getDb();
  const [record] = await db
    .select()
    .from(personalRecords)
    .where(
      and(eq(personalRecords.id, recordId), eq(personalRecords.userId, userId)),
    )
    .limit(1);

  if (!record) {
    return null;
  }

  const attachments = await db
    .select()
    .from(recordAttachments)
    .where(eq(recordAttachments.recordId, record.id))
    .orderBy(desc(recordAttachments.createdAt));

  return { record, attachments };
}
