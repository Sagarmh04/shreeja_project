import { createItemAction, toggleItemStatusAction, updateItemAction } from "@/app/actions";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { formatCurrency } from "@/lib/format";
import { getItems } from "@/lib/queries";

type AdminItemsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    target?: string;
  }>;
};

export default async function AdminItemsPage({ searchParams }: AdminItemsPageProps) {
  const params = await searchParams;
  const items = await getItems(true);

  return (
    <>
      <StatusBanner status={params.status} message={params.message} />

      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_70px_rgba(16,32,51,0.05)]">
        <h2 className="text-2xl font-semibold">Add item</h2>
        <p className="mt-2 text-sm text-[var(--muted-ink)]">
          Add new products and keep the active catalog up to date.
        </p>

        <form action={createItemAction} className="mt-6 grid gap-4 md:grid-cols-[1.5fr_1fr_auto]">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Item name</span>
            <input
              name="name"
              required
              placeholder="Premium tea powder"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Price</span>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="149.00"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <div className="flex items-end">
            <SubmitButton>Add item</SubmitButton>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {items.map((item) => {
          const isTarget = params.target === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-[2rem] border p-6 shadow-[0_20px_70px_rgba(16,32,51,0.05)] ${
                isTarget
                  ? "border-[var(--accent)] bg-[var(--panel-soft)]"
                  : "border-[var(--line)] bg-[var(--panel)]"
              }`}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <form action={updateItemAction} className="grid flex-1 gap-4 md:grid-cols-[1.5fr_1fr_auto]">
                  <input type="hidden" name="itemId" value={item.id} />
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="text-[var(--muted-ink)]">Item name</span>
                    <input
                      name="name"
                      defaultValue={item.name}
                      required
                      placeholder="Premium tea powder"
                      className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="text-[var(--muted-ink)]">Price</span>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={item.price}
                      required
                      placeholder="149.00"
                      className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                    />
                  </label>
                  <div className="flex items-end">
                    <SubmitButton>Save changes</SubmitButton>
                  </div>
                </form>

                <form action={toggleItemStatusAction} className="flex items-center gap-3">
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="nextActive" value={String(!item.is_active)} />
                  <div className="rounded-full bg-[var(--panel-soft)] px-4 py-2 text-sm text-[var(--muted-ink)]">
                    {item.is_active ? "Active" : "Removed"} · {formatCurrency(item.price)}
                  </div>
                  <SubmitButton className="rounded-full bg-transparent px-4 py-2 text-sm font-medium text-[var(--danger)] ring-1 ring-red-200 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                    {item.is_active ? "Remove item" : "Restore item"}
                  </SubmitButton>
                </form>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
