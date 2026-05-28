import { notFound } from "next/navigation";

import { insertAuditLog } from "@/lib/audit";
import { requireStaffContext } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getOrderDetail } from "@/lib/queries";

type StaffOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StaffOrderDetailPage({ params }: StaffOrderDetailPageProps) {
  const context = await requireStaffContext();
  const { id } = await params;

  try {
    const { order, orderItems } = await getOrderDetail(id);

    await insertAuditLog({
      userId: context.profile.id,
      changeType: "viewed order details",
      changeOnId: order.id,
      changeOnLabel: order.customer_name,
    });

    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_70px_rgba(16,32,51,0.05)]">
          <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-deep)]">Order detail</p>
          <h2 className="mt-2 text-3xl font-semibold">{order.order_number}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-[var(--panel-soft)] px-4 py-4 text-sm text-[var(--muted-ink)]">
              Customer: <span className="font-medium text-[var(--brand-ink)]">{order.customer_name}</span>
            </div>
            <div className="rounded-3xl bg-[var(--panel-soft)] px-4 py-4 text-sm text-[var(--muted-ink)]">
              Phone: <span className="font-medium text-[var(--brand-ink)]">{order.customer_phone}</span>
            </div>
            <div className="rounded-3xl bg-[var(--panel-soft)] px-4 py-4 text-sm text-[var(--muted-ink)]">
              Ordered at: <span className="font-medium text-[var(--brand-ink)]">{formatDateTime(order.ordered_at)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_70px_rgba(16,32,51,0.05)]">
          <h3 className="text-2xl font-semibold">Items</h3>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[var(--muted-ink)]">
                <tr>
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium">Qty</th>
                  <th className="pb-3 font-medium">Unit price</th>
                  <th className="pb-3 font-medium">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {orderItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4">{item.item_name}</td>
                    <td className="py-4">{item.quantity}</td>
                    <td className="py-4">{formatCurrency(item.unit_price)}</td>
                    <td className="py-4">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-[var(--panel-soft)] px-4 py-4 text-sm text-[var(--muted-ink)]">
              Discount: <span className="font-medium text-[var(--brand-ink)]">{formatCurrency(order.total_discount)}</span>
            </div>
            <div className="rounded-3xl bg-[var(--panel-soft)] px-4 py-4 text-sm text-[var(--muted-ink)]">
              Final total: <span className="font-medium text-[var(--brand-ink)]">{formatCurrency(order.total_price)}</span>
            </div>
          </div>
        </div>
      </section>
    );
  } catch {
    notFound();
  }
}
