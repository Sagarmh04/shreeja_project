import { desc } from "drizzle-orm";

import { DashboardShell } from "@/app/_components/dashboard-shell";
import { InputField, SelectField } from "@/app/_components/field";
import { SetupNotice } from "@/app/_components/setup-notice";
import { createAuditLog, getAuditLogs } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";
import { hasDatabaseEnv, hasSupabaseClientEnv } from "@/lib/env";
import { formatDateTime } from "@/lib/utils";

type AdminPageProps = {
  searchParams: Promise<{
    user?: string;
    action?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  if (!hasSupabaseClientEnv() || !hasDatabaseEnv()) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <SetupNotice message="The admin dashboard is ready, but queries will start working after you replace the __REPLACE_ME__ values in .env.local." />
      </main>
    );
  }

  const filters = await searchParams;
  const { profile } = await requireAdmin();
  const db = getDb();
  const [users, logs, actionTypes] = await Promise.all([
    db
      .select({
        id: profiles.id,
        email: profiles.email,
        fullName: profiles.fullName,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .orderBy(desc(profiles.createdAt))
      .limit(50),
    getAuditLogs(filters),
    db.selectDistinct({ action: auditLogs.action }).from(auditLogs),
  ]);

  await createAuditLog({
    actorUserId: profile.id,
    actorEmail: profile.email,
    action: "VIEW_AUDIT_LOGS",
    targetTable: "audit_logs",
  });

  return (
    <DashboardShell
      eyebrow="Admin dashboard"
      title="System activity at a glance"
      description="Review users, search the activity trail, and filter events by date or action."
      profileName={profile.fullName}
      adminLink
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-ink)]">
                The latest registered accounts in the system.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
              >
                <p className="font-semibold text-[var(--brand-ink)]">{user.fullName}</p>
                <p className="mt-1 text-sm text-[var(--muted-ink)]">{user.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--accent-deep)]">
                  Joined {formatDateTime(user.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Audit trail</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-ink)]">
                Search by user, action, or date range.
              </p>
            </div>
            <form className="grid gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--panel-soft)] p-4 md:grid-cols-2">
              <InputField
                label="User email"
                name="user"
                defaultValue={filters.user}
                placeholder="Search by email"
              />
              <SelectField label="Action" name="action" defaultValue={filters.action ?? ""}>
                <option value="">All actions</option>
                {actionTypes.map(({ action }) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </SelectField>
              <InputField label="From" name="from" type="date" defaultValue={filters.from} />
              <InputField label="To" name="to" type="date" defaultValue={filters.to} />
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand-ink)] px-5 text-sm font-semibold text-white"
                >
                  Apply filters
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--line)]">
            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] gap-3 bg-[var(--panel-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)]">
              <span>User</span>
              <span>Action</span>
              <span>Target</span>
              <span>Time</span>
            </div>
            <div className="divide-y divide-[var(--line)] bg-white">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] gap-3 px-4 py-4 text-sm text-[var(--brand-ink)]"
                >
                  <span className="truncate">{log.actorEmail}</span>
                  <span>{log.action}</span>
                  <span className="truncate">{log.targetTable}</span>
                  <span className="text-[var(--muted-ink)]">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
              {logs.length === 0 ? (
                <div className="px-4 py-8 text-sm text-[var(--muted-ink)]">
                  No audit logs match the selected filters.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
