import Link from "next/link";
import { unstable_rethrow } from "next/navigation";

import { DashboardShell } from "@/app/_components/dashboard-shell";
import { SetupNotice } from "@/app/_components/setup-notice";
import { createAuditLog } from "@/lib/audit";
import { requireAuth } from "@/lib/auth";
import { hasDatabaseEnv, hasSupabaseClientEnv } from "@/lib/env";
import { getUserRecords } from "@/lib/records";
import { formatDateTime } from "@/lib/utils";

export default async function RecordsPage() {
  if (!hasSupabaseClientEnv() || !hasDatabaseEnv()) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <SetupNotice message="The records module is ready, but database access will start working after you replace the __REPLACE_ME__ values in .env.local." />
      </main>
    );
  }

  const { profile } = await requireAuth();
  let records = [] as Awaited<ReturnType<typeof getUserRecords>>;
  let dataWarning: string | null = null;

  try {
    records = await getUserRecords(profile.id);

    await createAuditLog({
      actorUserId: profile.id,
      actorEmail: profile.email,
      action: "VIEW_RECORDS",
      targetTable: "personal_records",
      metadata: { surface: "records_list" },
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Records page data failed to load.", error);
    dataWarning = "Your session is active, but records could not be loaded right now.";
  }

  return (
    <DashboardShell
      eyebrow="Records"
      title="Your personal records"
      description="Browse, update, and organize every record you have added so far."
      profileName={profile.fullName}
      adminLink={profile.isAdmin}
    >
      <div className="rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
        {dataWarning ? (
          <div className="mb-5 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {dataWarning}
          </div>
        ) : null}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">All records</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted-ink)]">
              Each card opens into a detail view with attachments and edit actions.
            </p>
          </div>
          <Link
            href="/records/new"
            className="inline-flex rounded-full bg-[var(--brand-ink)] px-4 py-2 text-sm font-semibold text-white"
          >
            Add record
          </Link>
        </div>
        <div className="mt-6 grid gap-4">
          {records.map((record) => (
            <Link
              key={record.id}
              href={`/records/${record.id}`}
              className="rounded-[26px] border border-[var(--line)] bg-[var(--panel-soft)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-deep)]">
                    {record.category}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">
                    {record.title}
                  </h3>
                </div>
                <p className="text-sm text-[var(--muted-ink)]">
                  Updated {formatDateTime(record.updatedAt)}
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-ink)]">
                {record.description}
              </p>
            </Link>
          ))}
          {records.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-8 text-sm leading-7 text-[var(--muted-ink)]">
              You have not added any records yet.
            </div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
