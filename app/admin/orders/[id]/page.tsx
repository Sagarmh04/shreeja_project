import { notFound } from "next/navigation";

import { insertAuditLog } from "@/lib/audit";
import { requireAdminContext } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getOrderDetail } from "@/lib/queries";

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const context = await requireAdminContext();
  const { id } = await params;

  try {
    const { order, orderItems } = await getOrderDetail(id);

    await insertAuditLog({
      userId: context.profile!.id,
      eventKey: "order_viewed",
      changeType: "viewed order details",
      entityType: "order",
      entityId: order.id,
      entityLabel: order.customer_name,
      changeOnId: order.id,
      changeOnLabel: order.customer_name,
      eventMetadata: {
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        viewed_by_role: context.profile!.role,
      },
    });

    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_70px_rgba(16,32,51,0.05)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent-deep)]">Order detail</p>
              <h2 className="mt-2 text-3xl font-semibold">{order.order_number}</h2>
              <p className="mt-2 text-sm text-[var(--muted-ink)]">{formatDateTime(order.ordered_at)}</p>
            </div>
            <div className="rounded-3xl bg-[var(--panel-soft)] px-5 py-4 text-sm text-[var(--muted-ink)]">
              <div>Customer: {order.customer_name}</div>
              <div>Phone: {order.customer_phone}</div>
              <div>Created by: {order.ordered_by?.name ?? "Unknown"}</div>
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

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
