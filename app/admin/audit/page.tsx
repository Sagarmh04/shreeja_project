import { StatusBanner } from "@/components/status-banner";
import {
  formatAuditFieldLabel,
  formatAuditTarget,
  formatAuditValue,
  formatDateTime,
} from "@/lib/format";
import { getAuditLogs } from "@/lib/queries";

type AdminAuditPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

function buildAuditComparison(
  fromValue: Record<string, unknown> | null,
  toValue: Record<string, unknown> | null,
) {
  const keys = Array.from(
    new Set([...Object.keys(fromValue ?? {}), ...Object.keys(toValue ?? {})]),
  );

  return keys.map((key) => ({
    key,
    label: formatAuditFieldLabel(key),
    before: formatAuditValue(fromValue?.[key]),
    after: formatAuditValue(toValue?.[key]),
  }));
}

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const params = await searchParams;
  const auditLogs = await getAuditLogs(150);

  return (
    <>
      <StatusBanner status={params.status} message={params.message} />

      <section className="border-t border-[var(--line)] pt-6">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold">Audit timeline</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-ink)]">
            Review operational events with clearer field-level comparisons and more readable spacing.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {auditLogs.map((entry) => {
            const comparisons = buildAuditComparison(entry.from_value, entry.to_value);

            return (
              <article
                key={entry.id}
                className="border-b border-[var(--line)] pb-5 last:border-b-0"
              >
                <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_0.9fr]">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)]">
                      Timestamp
                    </p>
                    <p className="mt-2 text-sm text-[var(--brand-ink)]">
                      {formatDateTime(entry.timestamp)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)]">
                      User
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--brand-ink)]">
                      {entry.user?.name ?? "System"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-ink)]">
                      {entry.user?.staff_id ?? "-"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)]">
                      Event
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--brand-ink)]">
                      {entry.change_type}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)]">
                      Target
                    </p>
                    <p className="mt-2 text-sm text-[var(--brand-ink)]">
                      {formatAuditTarget(entry.change_on_label)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {comparisons.length === 0 ? (
                    <p className="text-sm text-[var(--muted-ink)]">
                      No field comparison for this event.
                    </p>
                  ) : (
                    <details className="group overflow-hidden rounded-xl border border-[var(--line)] bg-white">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--brand-ink)]">
                            Field changes
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted-ink)]">
                            {comparisons.length} field{comparisons.length === 1 ? "" : "s"} updated
                          </p>
                        </div>
                        <span className="text-sm text-[var(--muted-ink)] transition group-open:rotate-180">
                          v
                        </span>
                      </summary>

                      <div className="border-t border-[var(--line)] px-4 py-4">
                        <div className="hidden grid-cols-[1.1fr_1fr_1fr] gap-4 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)] md:grid">
                          <span>Field</span>
                          <span>Previous</span>
                          <span>Updated</span>
                        </div>

                        <div className="space-y-3">
                          {comparisons.map((item) => (
                            <div
                              key={item.key}
                              className="grid gap-3 border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0 md:grid-cols-[1.1fr_1fr_1fr] md:gap-4"
                            >
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)] md:hidden">
                                  Field
                                </p>
                                <p className="mt-1 text-sm font-medium text-[var(--brand-ink)] md:mt-0">
                                  {item.label}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)] md:hidden">
                                  Previous
                                </p>
                                <p className="mt-1 text-sm text-[var(--muted-ink)] md:mt-0">
                                  {item.before}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)] md:hidden">
                                  Updated
                                </p>
                                <p className="mt-1 text-sm text-[var(--brand-ink)] md:mt-0">
                                  {item.after}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
