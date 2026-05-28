import Link from "next/link";

import { createOrderAction } from "@/app/actions";
import { OrderBuilder } from "@/components/order-builder";
import { StatusBanner } from "@/components/status-banner";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { requireStaffContext } from "@/lib/auth";
import { getItems, getOrdersForStaff } from "@/lib/queries";

type StaffOrdersPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function StaffOrdersPage({ searchParams }: StaffOrdersPageProps) {
  const params = await searchParams;
  const context = await requireStaffContext();
  const [items, orders] = await Promise.all([
    getItems(false),
    getOrdersForStaff(context.profile.id, 50),
  ]);

  const totalValue = orders.reduce((sum, order) => sum + order.total_price, 0);

  return (
    <>
      <StatusBanner status={params.status} message={params.message} />

      <section className="grid gap-6 border-b border-[var(--line)] pb-6 md:grid-cols-3">
        <div>
          <p className="text-sm text-[var(--muted-ink)]">Your orders</p>
          <h2 className="mt-3 text-4xl font-semibold">{orders.length}</h2>
        </div>
        <div>
          <p className="text-sm text-[var(--muted-ink)]">Active catalog items</p>
          <h2 className="mt-3 text-4xl font-semibold">{items.length}</h2>
        </div>
        <div>
          <p className="text-sm text-[var(--muted-ink)]">Your order value</p>
          <h2 className="mt-3 text-4xl font-semibold">{formatCurrency(totalValue)}</h2>
        </div>
      </section>

      <OrderBuilder items={items} action={createOrderAction} />

      <section className="border-t border-[var(--line)] pt-6">
        <h2 className="text-2xl font-semibold">Past orders</h2>
        <p className="mt-2 text-sm text-[var(--muted-ink)]">You can view only the orders you created.</p>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[var(--muted-ink)]">
              <tr>
                <th className="pb-3 font-medium">Order</th>
                <th className="pb-3 font-medium">Customer</th>
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
                      href={`/staff/orders/${order.id}`}
                      prefetch={false}
                      className="font-medium text-[var(--accent-deep)] transition hover:text-[var(--brand-ink)]"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="py-4">
                    <div>{order.customer_name}</div>
                    <div className="text-[var(--muted-ink)]">{order.customer_phone}</div>
                  </td>
                  <td className="py-4">{formatCurrency(order.total_discount)}</td>
                  <td className="py-4">{formatCurrency(order.total_price)}</td>
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
