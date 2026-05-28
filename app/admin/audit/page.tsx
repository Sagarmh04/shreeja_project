import Link from "next/link";

import { StatusBanner } from "@/components/status-banner";
import {
  formatAuditEntityType,
  formatAuditHeadline,
  formatAuditMetaLine,
  getAuditTargetHref,
  groupAuditLogsByDay,
} from "@/lib/audit-feed";
import {
  formatAuditFieldLabel,
  formatAuditFieldValue,
  formatAuditTarget,
  formatDateLabel,
  formatDateTime,
} from "@/lib/format";
import { getAuditLogs } from "@/lib/queries";
import type { AuditRecord } from "@/lib/types";

type AdminAuditPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

type AuditWithUser = AuditRecord & {
  user: {
    name: string;
    staff_id: string | null;
    role?: "admin" | "staff" | null;
  } | null;
};

function getMetadata(entry: AuditRecord) {
  return (entry.event_metadata ?? {}) as Record<string, unknown>;
}

function getComparisonRows(entry: AuditRecord) {
  const metadata = getMetadata(entry);
  const rawChanges = metadata.changes;

  if (Array.isArray(rawChanges) && rawChanges.length > 0) {
    return rawChanges
      .filter(
        (item): item is { field: string; from: unknown; to: unknown } =>
          typeof item === "object" &&
          item !== null &&
          "field" in item &&
          typeof item.field === "string",
      )
      .map((item) => ({
        field: item.field,
        label: formatAuditFieldLabel(item.field),
        before: formatAuditFieldValue(item.field, item.from),
        after: formatAuditFieldValue(item.field, item.to),
      }));
  }

  const keys = Array.from(
    new Set([...Object.keys(entry.from_value ?? {}), ...Object.keys(entry.to_value ?? {})]),
  );

  return keys.map((field) => ({
    field,
    label: formatAuditFieldLabel(field),
    before: formatAuditFieldValue(field, entry.from_value?.[field]),
    after: formatAuditFieldValue(field, entry.to_value?.[field]),
  }));
}

function renderComparisonBlock(entry: AuditRecord) {
  const rows = getComparisonRows(entry);

  if (rows.length === 0) {
    return null;
  }

  return (
    <details className="group mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[var(--brand-ink)]">Changed fields</p>
          <p className="mt-1 text-sm text-[var(--muted-ink)]">
            {rows.length} field{rows.length === 1 ? "" : "s"} updated
          </p>
        </div>
        <span className="text-sm text-[var(--muted-ink)] transition group-open:rotate-180">v</span>
      </summary>

      <div className="border-t border-[var(--line)] px-4 py-4">
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.field}
              className="grid gap-3 border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0 md:grid-cols-[0.9fr_1fr_1fr]"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
                  Field
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--brand-ink)]">{row.label}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
                  Previous
                </p>
                <p className="mt-1 text-sm text-[var(--muted-ink)]">{row.before}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
                  Updated
                </p>
                <p className="mt-1 text-sm text-[var(--brand-ink)]">{row.after}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

function renderStatusTransition(entry: AuditRecord) {
  const metadata = getMetadata(entry);

  if (!("status_from" in metadata) || !("status_to" in metadata)) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <span className="rounded-full bg-[var(--panel-soft)] px-3 py-1 text-[var(--muted-ink)]">
        {formatAuditFieldValue("is_active", metadata.status_from)}
      </span>
      <span className="text-[var(--muted-ink)]">to</span>
      <span className="rounded-full bg-[var(--panel-soft)] px-3 py-1 text-[var(--brand-ink)]">
        {formatAuditFieldValue("is_active", metadata.status_to)}
      </span>
    </div>
  );
}

function renderOrderItems(entry: AuditRecord) {
  const metadata = getMetadata(entry);
  const items = metadata.items;

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <details className="group mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[var(--brand-ink)]">Purchased items</p>
          <p className="mt-1 text-sm text-[var(--muted-ink)]">
            {items.length} line{items.length === 1 ? "" : "s"} included
          </p>
        </div>
        <span className="text-sm text-[var(--muted-ink)] transition group-open:rotate-180">v</span>
      </summary>
      <div className="border-t border-[var(--line)] px-4 py-4">
        <div className="space-y-3">
          {items.map((item, index) => {
            if (typeof item !== "object" || item === null) {
              return null;
            }

            const row = item as Record<string, unknown>;

            return (
              <div
                key={`${String(row.item_name)}-${index}`}
                className="grid gap-2 border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0 md:grid-cols-[1.5fr_0.8fr_0.8fr]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--brand-ink)]">
                    {formatAuditFieldValue("item_name", row.item_name)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-ink)]">
                    {formatAuditFieldValue("unit_price", row.unit_price)} each
                  </p>
                </div>
                <div className="text-sm text-[var(--muted-ink)]">
                  Qty: {formatAuditFieldValue("quantity", row.quantity)}
                </div>
                <div className="text-sm font-medium text-[var(--brand-ink)] md:text-right">
                  {formatAuditFieldValue("total_price", row.total_price)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}

function renderEventBody(entry: AuditWithUser) {
  const metadata = getMetadata(entry);

  switch (entry.event_key) {
    case "order_created":
      return (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
                Order number
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--brand-ink)]">
                {formatAuditFieldValue("order_number", metadata.order_number)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
                Customer phone
              </p>
              <p className="mt-1 text-sm text-[var(--brand-ink)]">
                {formatAuditFieldValue("customer_phone", metadata.customer_phone)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
                Subtotal
              </p>
              <p className="mt-1 text-sm text-[var(--brand-ink)]">
                {formatAuditFieldValue("subtotal", metadata.subtotal)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
                Final total
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--brand-ink)]">
                {formatAuditFieldValue("final_total", metadata.final_total)}
              </p>
            </div>
          </div>
          {renderOrderItems(entry)}
        </div>
      );
    case "order_viewed":
      return (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Order number
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("order_number", metadata.order_number)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Customer
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("customer_name", metadata.customer_name)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Customer phone
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("customer_phone", metadata.customer_phone)}
            </p>
          </div>
        </div>
      );
    case "staff_created":
      return (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Staff ID
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("staff_id", (metadata.snapshot as Record<string, unknown> | undefined)?.staff_id)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Phone
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("phone", (metadata.snapshot as Record<string, unknown> | undefined)?.phone)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Email
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("email", (metadata.snapshot as Record<string, unknown> | undefined)?.email)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Status
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("is_active", (metadata.snapshot as Record<string, unknown> | undefined)?.is_active)}
            </p>
          </div>
        </div>
      );
    case "staff_updated":
    case "store_profile_updated":
    case "item_updated":
      return renderComparisonBlock(entry);
    case "staff_activated":
    case "staff_deactivated":
    case "item_removed":
    case "item_restored":
      return renderStatusTransition(entry);
    case "item_created":
      return (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Item name
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("name", (metadata.snapshot as Record<string, unknown> | undefined)?.name)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Price
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("price", (metadata.snapshot as Record<string, unknown> | undefined)?.price)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Status
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("is_active", (metadata.snapshot as Record<string, unknown> | undefined)?.is_active)}
            </p>
          </div>
        </div>
      );
    case "staff_profile_viewed":
      return (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Profile
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("name", metadata.name ?? entry.entity_label)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Staff ID
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {formatAuditFieldValue("staff_id", metadata.staff_id)}
            </p>
          </div>
        </div>
      );
    case "store_profile_viewed":
      return (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
            Store
          </p>
          <p className="mt-1 text-sm text-[var(--brand-ink)]">
            {formatAuditFieldValue("store_name", metadata.store_name ?? entry.entity_label)}
          </p>
        </div>
      );
    case "auth_logged_in":
    case "auth_logged_out":
      return (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <div className="rounded-full bg-[var(--panel-soft)] px-3 py-1.5 text-[var(--brand-ink)]">
            {entry.user?.role === "admin"
              ? "Admin account"
              : entry.user?.role === "staff"
                ? "Staff account"
                : "Account access"}
          </div>
          {entry.user?.staff_id ? (
            <div className="rounded-full bg-[var(--panel-soft)] px-3 py-1.5 text-[var(--muted-ink)]">
              Staff ID {entry.user.staff_id}
            </div>
          ) : null}
        </div>
      );
    default:
      return renderComparisonBlock(entry) ?? (
        <p className="mt-4 text-sm text-[var(--muted-ink)]">
          No additional event details are available.
        </p>
      );
  }
}

function renderTargetLink(entry: AuditRecord) {
  const href = getAuditTargetHref(entry);
  const target = formatAuditTarget(entry.entity_label ?? entry.change_on_label);

  if (!href || target === "-") {
    return null;
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex items-center rounded-full border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--brand-ink)] transition hover:border-[var(--accent)]"
    >
      Open {entry.entity_type ?? "record"}
    </Link>
  );
}

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const params = await searchParams;
  const auditLogs = (await getAuditLogs(150)) as AuditWithUser[];
  const groupedLogs = groupAuditLogsByDay(auditLogs);

  return (
    <>
      <StatusBanner status={params.status} message={params.message} />

      <section className="border-t border-[var(--line)] pt-6">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold">Audit timeline</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-ink)]">
            Review who opened, updated, created, removed, or signed in across the workspace, with the person, target,
            and time shown clearly.
          </p>
        </div>

        <div className="mt-8 space-y-10">
          {groupedLogs.map((group) => (
            <section key={group.label}>
              <div className="border-b border-[var(--line)] pb-3">
                <h3 className="text-lg font-semibold text-[var(--brand-ink)]">
                  {group.label === "Today" || group.label === "Yesterday"
                    ? group.label
                    : formatDateLabel(group.label)}
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                {group.items.map((entry) => {
                  const target = formatAuditTarget(entry.entity_label ?? entry.change_on_label);
                  const entityTypeLabel = formatAuditEntityType(entry.entity_type);

                  return (
                    <article key={entry.id} className="rounded-2xl border border-[var(--line)] bg-white px-5 py-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
                            {formatDateTime(entry.timestamp)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold leading-7 text-[var(--brand-ink)]">
                              {formatAuditHeadline(entry)}
                            </h4>
                            {entityTypeLabel ? (
                              <span className="rounded-full bg-[var(--panel-soft)] px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-ink)]">
                                {entityTypeLabel}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-2 text-sm text-[var(--muted-ink)]">{formatAuditMetaLine(entry)}</p>

                          {target !== "-" && entry.event_key !== "order_created" && entry.event_key !== "order_viewed" ? (
                            <p className="mt-3 text-sm text-[var(--muted-ink)]">
                              Record: <span className="font-medium text-[var(--brand-ink)]">{target}</span>
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0">{renderTargetLink(entry)}</div>
                      </div>

                      {renderEventBody(entry)}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
