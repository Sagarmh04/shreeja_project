import Link from "next/link";

import { StatusBanner } from "@/components/status-banner";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getAllOrdersForAdmin } from "@/lib/queries";

type AdminOrdersPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const orders = await getAllOrdersForAdmin();

  return (
    <>
      <StatusBanner status={params.status} message={params.message} />

      <section className="border-t border-[var(--line)] pt-6">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold">Orders</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-ink)]">
            Review all orders placed across the store, including customer details, staff ownership, and totals.
          </p>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[var(--muted-ink)]">
              <tr>
                <th className="pb-3 font-medium">Order</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Created by</th>
                <th className="pb-3 font-medium">Discount</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Ordered at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {orders.map((order) => (
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
                    <div className="font-medium text-[var(--brand-ink)]">{order.customer_name}</div>
                    <div className="text-[var(--muted-ink)]">{order.customer_phone}</div>
                  </td>
                  <td className="py-4">
                    <div>{order.ordered_by?.name ?? "Unknown"}</div>
                    <div className="text-[var(--muted-ink)]">{order.ordered_by?.staff_id ?? "-"}</div>
                  </td>
                  <td className="py-4">{formatCurrency(order.total_discount)}</td>
                  <td className="py-4 font-medium text-[var(--brand-ink)]">
                    {formatCurrency(order.total_price)}
                  </td>
                  <td className="py-4 text-[var(--muted-ink)]">{formatDateTime(order.ordered_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
