import Link from "next/link";

import { StatusBanner } from "@/components/status-banner";
import { formatAuditHeadline, formatAuditMetaLine } from "@/lib/audit-feed";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  getAuditLogs,
  getItems,
  getOrdersForAdmin,
  getStaffMembers,
  getStoreProfile,
} from "@/lib/queries";

type AdminOverviewPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminOverviewPage({
  searchParams,
}: AdminOverviewPageProps) {
  const params = await searchParams;
  const [store, staffMembers, items, recentOrders, recentAudits] = await Promise.all([
    getStoreProfile(),
    getStaffMembers(),
    getItems(true),
    getOrdersForAdmin(20),
    getAuditLogs(8),
  ]);

  const activeStaff = staffMembers.filter((staff) => staff.is_active).length;
  const activeItems = items.filter((item) => item.is_active).length;
  const totalRevenue = recentOrders.reduce((sum, order) => sum + order.total_price, 0);

  return (
    <>
      <StatusBanner status={params.status} message={params.message} />

      <section className="grid gap-6 border-b border-[var(--line)] pb-6 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-sm text-[var(--muted-ink)]">Store</p>
          <h2 className="mt-3 text-2xl font-semibold">{store.store_name}</h2>
          <p className="mt-2 text-sm text-[var(--muted-ink)]">{store.address}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--muted-ink)]">Active staff</p>
          <h2 className="mt-3 text-4xl font-semibold">{activeStaff}</h2>
          <p className="mt-2 text-sm text-[var(--muted-ink)]">{staffMembers.length} total staff accounts</p>
        </div>
        <div>
          <p className="text-sm text-[var(--muted-ink)]">Active catalog items</p>
          <h2 className="mt-3 text-4xl font-semibold">{activeItems}</h2>
          <p className="mt-2 text-sm text-[var(--muted-ink)]">{items.length} items in the database</p>
        </div>
        <div>
          <p className="text-sm text-[var(--muted-ink)]">Recent order value</p>
          <h2 className="mt-3 text-4xl font-semibold">{formatCurrency(totalRevenue)}</h2>
          <p className="mt-2 text-sm text-[var(--muted-ink)]">{recentOrders.length} latest orders shown below</p>
        </div>
      </section>

      <section className="grid gap-10 xl:grid-cols-[1.5fr_0.9fr]">
        <div>
          <h2 className="text-2xl font-semibold">All orders</h2>
          <p className="mt-2 text-sm text-[var(--muted-ink)]">
            The admin can review every order placed by staff members.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[var(--muted-ink)]">
                <tr>
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Staff</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        prefetch={false}
                        className="font-medium text-[var(--accent-deep)] transition hover:text-[var(--brand-ink)]"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-4">
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-[var(--muted-ink)]">{order.customer_phone}</div>
                    </td>
                    <td className="py-4">
                      <div>{order.ordered_by?.name ?? "Unknown"}</div>
                      <div className="text-[var(--muted-ink)]">{order.ordered_by?.staff_id ?? "-"}</div>
                    </td>
                    <td className="py-4">{formatCurrency(order.total_price)}</td>
                    <td className="py-4 text-[var(--muted-ink)]">{formatDateTime(order.ordered_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">Recent audit activity</h2>
          <div className="mt-6 space-y-4">
            {recentAudits.map((audit) => (
              <div key={audit.id} className="border-b border-[var(--line)] pb-4 last:border-b-0">
                <p className="text-sm font-medium text-[var(--brand-ink)]">
                  {formatAuditHeadline(audit)}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-ink)]">{formatAuditMetaLine(audit)}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                  {formatDateTime(audit.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
