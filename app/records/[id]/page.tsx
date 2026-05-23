import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/app/_components/button";
import { DashboardShell } from "@/app/_components/dashboard-shell";
import { SetupNotice } from "@/app/_components/setup-notice";
import { deleteAttachmentAction, deleteRecordAction } from "@/app/actions/records";
import { createAuditLog } from "@/lib/audit";
import { requireAuth } from "@/lib/auth";
import { hasDatabaseEnv, hasSupabaseClientEnv } from "@/lib/env";
import { getRecordById } from "@/lib/records";
import { formatDateTime } from "@/lib/utils";

type RecordDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecordDetailPage({
  params,
}: RecordDetailPageProps) {
  if (!hasSupabaseClientEnv() || !hasDatabaseEnv()) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <SetupNotice message="The record detail screen is ready, but data access will start working after you replace the __REPLACE_ME__ values in .env.local." />
      </main>
    );
  }

  const { id } = await params;
  const { profile } = await requireAuth();
  const data = await getRecordById(id, profile.id);

  if (!data) {
    notFound();
  }

  await createAuditLog({
    actorUserId: profile.id,
    actorEmail: profile.email,
    action: "VIEW_RECORD",
    targetTable: "personal_records",
    targetId: data.record.id,
  });

  return (
    <DashboardShell
      eyebrow={data.record.category}
      title={data.record.title}
      description="A detailed view of the selected record, including quick facts and stored attachments."
      profileName={profile.fullName}
      adminLink={profile.isAdmin}
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted-ink)]">
              Updated {formatDateTime(data.record.updatedAt)}
            </p>
            <div className="flex gap-3">
              <Link href={`/records/${data.record.id}/edit`}>
                <Button variant="secondary">Edit record</Button>
              </Link>
              <form action={deleteRecordAction.bind(null, data.record.id)}>
                <Button type="submit" variant="danger">
                  Delete
                </Button>
              </form>
            </div>
          </div>
          <p className="mt-6 text-sm leading-8 text-[var(--muted-ink)]">
            {data.record.description}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {data.record.quickFacts.map((fact) => (
              <div
                key={`${fact.label}-${fact.value}`}
                className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-deep)]">
                  {fact.label}
                </p>
                <p className="mt-2 text-base font-medium text-[var(--brand-ink)]">
                  {fact.value}
                </p>
              </div>
            ))}
            {data.record.quickFacts.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--muted-ink)]">
                No quick facts added for this record.
              </div>
            ) : null}
          </div>
        </section>

        <aside className="rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-semibold tracking-tight">Attachments</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted-ink)]">
            Files are stored alongside the record for quick retrieval later.
          </p>
          <div className="mt-6 grid gap-4">
            {data.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
              >
                <p className="font-medium text-[var(--brand-ink)]">{attachment.fileName}</p>
                <p className="mt-1 text-sm text-[var(--muted-ink)]">
                  Added {formatDateTime(attachment.createdAt)}
                </p>
                <form
                  action={deleteAttachmentAction.bind(
                    null,
                    attachment.id,
                    data.record.id,
                    attachment.filePath,
                  )}
                  className="mt-4"
                >
                  <Button type="submit" variant="ghost">
                    Remove attachment
                  </Button>
                </form>
              </div>
            ))}
            {data.attachments.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm text-[var(--muted-ink)]">
                No attachments uploaded for this record yet.
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
