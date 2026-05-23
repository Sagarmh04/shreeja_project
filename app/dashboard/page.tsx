import Link from "next/link";
import { FileText, Plus, Shield } from "lucide-react";

import { DashboardShell } from "@/app/_components/dashboard-shell";
import { SetupNotice } from "@/app/_components/setup-notice";
import { createAuditLog } from "@/lib/audit";
import { requireAuth } from "@/lib/auth";
import { hasDatabaseEnv, hasSupabaseClientEnv } from "@/lib/env";
import { getRecentLogin } from "@/lib/profile";
import { getUserRecords } from "@/lib/records";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  if (!hasSupabaseClientEnv() || !hasDatabaseEnv()) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <SetupNotice message="Dashboard screens are ready, but data access will start working after you replace the __REPLACE_ME__ values in .env.local." />
      </main>
    );
  }

  const { profile } = await requireAuth();
  const [records, recentLogin] = await Promise.all([
    getUserRecords(profile.id),
    getRecentLogin(profile.id),
  ]);

  await createAuditLog({
    actorUserId: profile.id,
    actorEmail: profile.email,
    action: "VIEW_RECORDS",
    targetTable: "personal_records",
    metadata: { surface: "dashboard" },
  });

  return (
    <DashboardShell
      eyebrow="Customer workspace"
      title="Everything important, collected in one place."
      description="Keep personal details clear, current, and easy to find. The layout is designed to feel friendly first, without exposing the mechanics behind the system."
      profileName={profile.fullName}
      adminLink={profile.isAdmin}
    >
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Active records",
                value: `${records.length}`,
                icon: FileText,
              },
              {
                label: "Most recent sign-in",
                value: recentLogin ? formatDateTime(recentLogin.loginAt) : "First visit",
                icon: Shield,
              },
              {
                label: "Ready to add",
                value: "New information",
                icon: Plus,
              },
            ].map(({ label, value, icon: Icon }) => (
              <article
                key={label}
                className="rounded-[28px] border border-white/60 bg-white/92 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--panel-soft)] text-[var(--accent-deep)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-[var(--muted-ink)]">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">
                  {value}
                </p>
              </article>
            ))}
          </div>

          <div className="rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Recently updated records
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-ink)]">
                  Open a card to view full details, add attachments, or make a change.
                </p>
              </div>
              <Link
                href="/records/new"
                className="rounded-full bg-[var(--brand-ink)] px-4 py-2 text-sm font-semibold text-white"
              >
                Add record
              </Link>
            </div>

            <div className="mt-6 grid gap-4">
              {records.slice(0, 4).map((record) => (
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
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-ink)]">
                    {record.description}
                  </p>
                </Link>
              ))}

              {records.length === 0 ? (
                <div className="rounded-[26px] border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-8 text-sm leading-7 text-[var(--muted-ink)]">
                  No records yet. Start with one simple entry and build from there.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="grid gap-6">
          <div className="rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-deep)]">
              Profile snapshot
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              {profile.fullName}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-ink)]">{profile.email}</p>
            <Link
              href="/settings"
              className="mt-6 inline-flex rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--brand-ink)]"
            >
              Edit profile
            </Link>
          </div>
          <div className="rounded-[32px] border border-white/60 bg-[linear-gradient(145deg,#102033_0%,#123453_100%)] p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Fast path
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Add your next record in under a minute.
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/78">
              The record form is flexible enough for contact details, identity notes,
              emergency information, and similar quick references.
            </p>
            <Link
              href="/records/new"
              className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-ink)]"
            >
              Start a new record
            </Link>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
