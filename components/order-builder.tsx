"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { IntegerInput } from "@/components/integer-input";
import { SubmitButton } from "@/components/submit-button";
import { formatCurrency } from "@/lib/format";
import type { ItemRecord } from "@/lib/types";

type OrderBuilderProps = {
  items: ItemRecord[];
  action: (formData: FormData) => void | Promise<void>;
};

type LineItem = {
  id: string;
  itemId: string;
  quantity: string;
};

function createLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    itemId: "",
    quantity: "",
  };
}

export function OrderBuilder({ items, action }: OrderBuilderProps) {
  const [rows, setRows] = useState<LineItem[]>([createLineItem()]);
  const [discount, setDiscount] = useState("0");

  const summary = useMemo(() => {
    const selectedItems = rows
      .map((row) => {
        const item = items.find((entry) => entry.id === row.itemId);
        const quantity = Number(row.quantity);

        if (!item || !Number.isFinite(quantity) || quantity <= 0) {
          return null;
        }

        const total = Number((item.price * quantity).toFixed(2));

        return {
          rowId: row.id,
          name: item.name,
          quantity,
          unitPrice: item.price,
          total,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const parsedDiscount = Number(discount || "0");
    const safeDiscount =
      Number.isFinite(parsedDiscount) && parsedDiscount > 0
        ? Math.min(parsedDiscount, subtotal)
        : 0;
    const finalTotal = Math.max(0, Number((subtotal - safeDiscount).toFixed(2)));

    return {
      selectedItems,
      subtotal,
      safeDiscount,
      finalTotal,
    };
  }, [discount, items, rows]);

  return (
    <form action={action} className="space-y-6 border-t border-[var(--line)] pt-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-[var(--brand-ink)]">Create order</h2>
        <p className="text-sm text-[var(--muted-ink)]">
          Add customer details, choose one or more catalog items, review the totals, and submit.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-[var(--muted-ink)]">Customer name</span>
          <input
            name="customerName"
            required
            className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            placeholder="Josh"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-[var(--muted-ink)]">Customer phone</span>
          <input
            name="customerPhone"
            required
            className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            placeholder=" 98765 43210"
          />
        </label>
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 border-b border-[var(--line)] pb-4 md:grid-cols-[1.8fr_0.8fr_auto]"
          >
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--muted-ink)]">Item {index + 1}</span>
              <select
                name="itemId"
                value={row.itemId}
                onChange={(event) => {
                  setRows((current) =>
                    current.map((entry) =>
                      entry.id === row.id ? { ...entry, itemId: event.target.value } : entry,
                    ),
                  );
                }}
                required
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              >
                <option value="">Select an item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({formatCurrency(item.price)})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--muted-ink)]">Quantity</span>
              <IntegerInput
                name="quantity"
                value={row.quantity}
                required
                min={1}
                placeholder="1"
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                onValueChange={(nextValue) => {
                  setRows((current) =>
                    current.map((entry) =>
                      entry.id === row.id ? { ...entry, quantity: nextValue } : entry,
                    ),
                  );
                }}
              />
            </label>

            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => {
                  setRows((current) =>
                    current.length === 1
                      ? current
                      : current.filter((entry) => entry.id !== row.id),
                  );
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-3 text-sm text-[var(--brand-ink)] transition hover:border-red-300 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setRows((current) => [...current, createLineItem()])}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--brand-ink)] transition hover:border-[var(--accent)]"
        >
          <Plus className="h-4 w-4" />
          Add another item
        </button>
      </div>

      <section className="border-t border-[var(--line)] pt-5">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-ink)]">Order summary</h3>
            <p className="mt-1 text-sm text-[var(--muted-ink)]">
              Review selected items and totals before applying the final discount.
            </p>

            <div className="mt-4 space-y-3">
              {summary.selectedItems.length === 0 ? (
                <div className="text-sm text-[var(--muted-ink)]">
                  No valid items selected yet.
                </div>
              ) : (
                summary.selectedItems.map((item) => (
                  <div
                    key={item.rowId}
                    className="grid gap-2 border-b border-[var(--line)] pb-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]"
                  >
                    <div>
                      <p className="font-medium text-[var(--brand-ink)]">{item.name}</p>
                      <p className="text-sm text-[var(--muted-ink)]">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="text-sm text-[var(--muted-ink)]">
                      Qty: <span className="text-[var(--brand-ink)]">{item.quantity}</span>
                    </div>
                    <div className="text-sm font-medium text-[var(--brand-ink)] md:text-right">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[var(--muted-ink)]">Order discount</span>
              <input
                name="totalDiscount"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                placeholder="0.00"
              />
            </label>

            <div className="space-y-3 border-t border-[var(--line)] pt-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted-ink)]">Items selected</span>
                <span className="font-medium text-[var(--brand-ink)]">
                  {summary.selectedItems.length}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted-ink)]">Subtotal</span>
                <span className="font-medium text-[var(--brand-ink)]">
                  {formatCurrency(summary.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted-ink)]">Discount</span>
                <span className="font-medium text-[var(--brand-ink)]">
                  {formatCurrency(summary.safeDiscount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-3">
                <span className="text-base font-semibold text-[var(--brand-ink)]">Final total</span>
                <span className="text-base font-semibold text-[var(--brand-ink)]">
                  {formatCurrency(summary.finalTotal)}
                </span>
              </div>
            </div>

            <SubmitButton>Create order</SubmitButton>
          </div>
        </div>
      </section>
    </form>
  );
}
