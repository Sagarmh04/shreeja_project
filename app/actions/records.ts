"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { personalRecords, recordAttachments } from "@/lib/db/schema";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordSchema } from "@/lib/validators";

function parseQuickFacts(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as Array<{ label: string; value: string }>;
    return parsed.filter((fact) => fact.label.trim() && fact.value.trim());
  } catch {
    return [];
  }
}

async function uploadAttachments(userId: string, recordId: string, files: File[]) {
  if (!files.length) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const db = getDb();

  for (const file of files) {
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const filePath = `${userId}/${recordId}/${crypto.randomUUID()}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("record-attachments")
      .upload(filePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    await db.insert(recordAttachments).values({
      recordId,
      userId,
      fileName: file.name,
      filePath,
      mimeType: file.type || null,
      sizeInBytes: `${file.size}`,
    });
  }
}

export async function createRecordAction(formData: FormData) {
  const session = await requireAuth();
  const parsed = recordSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description"),
    quickFacts: parseQuickFacts(formData.get("quickFacts")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Record is invalid.");
  }

  const db = getDb();
  const [record] = await db
    .insert(personalRecords)
    .values({
      userId: session.profile.id,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      quickFacts: parsed.data.quickFacts,
    })
    .returning();

  const files = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);

  await uploadAttachments(session.profile.id, record.id, files);

  await createAuditLog({
    actorUserId: session.profile.id,
    actorEmail: session.profile.email,
    action: "CREATE_RECORD",
    targetTable: "personal_records",
    targetId: record.id,
  });

  revalidatePath("/records");
  redirect(`/records/${record.id}`);
}

export async function updateRecordAction(recordId: string, formData: FormData) {
  const session = await requireAuth();
  const parsed = recordSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description"),
    quickFacts: parseQuickFacts(formData.get("quickFacts")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Record is invalid.");
  }

  const db = getDb();
  const [record] = await db
    .update(personalRecords)
    .set({
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      quickFacts: parsed.data.quickFacts,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(personalRecords.id, recordId),
        eq(personalRecords.userId, session.profile.id),
      ),
    )
    .returning();

  if (!record) {
    throw new Error("Record not found.");
  }

  const files = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);

  await uploadAttachments(session.profile.id, record.id, files);

  await createAuditLog({
    actorUserId: session.profile.id,
    actorEmail: session.profile.email,
    action: "UPDATE_RECORD",
    targetTable: "personal_records",
    targetId: record.id,
  });

  revalidatePath(`/records/${record.id}`);
  revalidatePath("/records");
  redirect(`/records/${record.id}`);
}

export async function deleteRecordAction(recordId: string) {
  const session = await requireAuth();
  const db = getDb();
  const attachments = await db
    .select()
    .from(recordAttachments)
    .where(
      and(
        eq(recordAttachments.recordId, recordId),
        eq(recordAttachments.userId, session.profile.id),
      ),
    );

  if (attachments.length) {
    const supabase = getSupabaseAdminClient();
    await supabase.storage
      .from("record-attachments")
      .remove(attachments.map((attachment) => attachment.filePath));
  }

  await db
    .delete(personalRecords)
    .where(
      and(
        eq(personalRecords.id, recordId),
        eq(personalRecords.userId, session.profile.id),
      ),
    );

  await createAuditLog({
    actorUserId: session.profile.id,
    actorEmail: session.profile.email,
    action: "DELETE_RECORD",
    targetTable: "personal_records",
    targetId: recordId,
  });

  revalidatePath("/records");
  redirect("/records");
}

export async function deleteAttachmentAction(
  attachmentId: string,
  recordId: string,
  filePath: string,
) {
  const session = await requireAuth();
  const db = getDb();
  await db
    .delete(recordAttachments)
    .where(
      and(
        eq(recordAttachments.id, attachmentId),
        eq(recordAttachments.userId, session.profile.id),
      ),
    );

  const supabase = getSupabaseAdminClient();
  await supabase.storage.from("record-attachments").remove([filePath]);

  await createAuditLog({
    actorUserId: session.profile.id,
    actorEmail: session.profile.email,
    action: "DELETE_ATTACHMENT",
    targetTable: "record_attachments",
    targetId: attachmentId,
    metadata: { recordId },
  });

  revalidatePath(`/records/${recordId}`);
}
