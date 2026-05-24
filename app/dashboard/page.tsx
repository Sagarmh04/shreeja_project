import Link from "next/link";
import { FileText, Plus, Shield } from "lucide-react";
import { unstable_rethrow } from "next/navigation";

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
  let records = [] as Awaited<ReturnType<typeof getUserRecords>>;
  let recentLogin: Awaited<ReturnType<typeof getRecentLogin>> = null;
  let dataWarning: string | null = null;

  try {
    [records, recentLogin] = await Promise.all([
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
  } catch (error) {
    unstable_rethrow(error);
    console.error("Dashboard data failed to load.", error);
    dataWarning =
      "Your session is active, but some dashboard data could not be loaded right now.";
  }

  return (
    <DashboardShell
      eyebrow="Member home"
      title="Everything important, collected in one place."
      description="Keep your care details clear, current, and easy to find whenever you need them."
      profileName={profile.fullName}
      adminLink={profile.isAdmin}
    >
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="grid gap-6">
          {dataWarning ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              {dataWarning}
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Saved records",
                value: `${records.length}`,
                icon: FileText,
              },
              {
                label: "Latest visit",
                value: recentLogin ? formatDateTime(recentLogin.loginAt) : "First visit",
                icon: Shield,
              },
              {
                label: "Ready to update",
                value: "Profile details",
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
                  Recently updated details
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-ink)]">
                  Open any card to review the full details, update information, or manage files.
                </p>
              </div>
              <Link
                href="/records/new"
                className="rounded-full bg-[var(--brand-ink)] px-4 py-2 text-sm font-semibold text-white"
              >
                Add details
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
                  No details added yet. Start with one simple entry and build from there.
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
              Add your next detail in under a minute.
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/78">
              Use the flexible form for contact details, emergency references,
              wellness notes, and similar quick references.
            </p>
            <Link
              href="/records/new"
              className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-ink)]"
            >
              Start a new entry
            </Link>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
