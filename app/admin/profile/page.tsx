import { updateStoreProfileAction } from "@/app/actions";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { insertAuditLog } from "@/lib/audit";
import { requireAdminContext } from "@/lib/auth";
import { getStoreProfile } from "@/lib/queries";

type AdminProfilePageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminProfilePage({ searchParams }: AdminProfilePageProps) {
  const params = await searchParams;
  const context = await requireAdminContext();
  const store = await getStoreProfile();

  await insertAuditLog({
    userId: context.profile!.id,
    changeType: "viewed profile",
    changeOnId: store.id,
    changeOnLabel: store.store_name,
  });

  return (
    <>
      <StatusBanner status={params.status} message={params.message} />

      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_70px_rgba(16,32,51,0.05)]">
        <h2 className="text-2xl font-semibold">Store profile</h2>
        <p className="mt-2 text-sm text-[var(--muted-ink)]">
          Update the store information shown throughout the workspace.
        </p>

        <form action={updateStoreProfileAction} className="mt-6 space-y-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Store name</span>
            <input
              name="storeName"
              defaultValue={store.store_name}
              required
              placeholder="Northern Star"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Store phone</span>
            <input
              name="phone"
              defaultValue={store.phone}
              required
              placeholder="99864 27145"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Address</span>
            <textarea
              name="address"
              defaultValue={store.address}
              required
              rows={4}
              placeholder="4th Cross, Vidyanagar, Hubli, Karnataka, India"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <SubmitButton>Save store profile</SubmitButton>
        </form>
      </section>
    </>
  );
}
