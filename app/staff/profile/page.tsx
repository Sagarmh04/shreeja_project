import { updateOwnProfileAction } from "@/app/actions";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { insertAuditLog } from "@/lib/audit";
import { requireStaffContext } from "@/lib/auth";

type StaffProfilePageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function StaffProfilePage({ searchParams }: StaffProfilePageProps) {
  const params = await searchParams;
  const context = await requireStaffContext();

  await insertAuditLog({
    userId: context.profile.id,
    changeType: "viewed profile",
    changeOnId: context.profile.id,
    changeOnLabel: context.profile.name,
  });

  return (
    <>
      <StatusBanner status={params.status} message={params.message} />

      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_70px_rgba(16,32,51,0.05)]">
        <h2 className="text-2xl font-semibold">Your profile</h2>
        <p className="mt-2 text-sm text-[var(--muted-ink)]">
          Update your display name and phone number used in the store workspace.
        </p>

        <form action={updateOwnProfileAction} className="mt-6 space-y-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Name</span>
            <input
              name="name"
              defaultValue={context.profile.name}
              required
              placeholder="David Warner"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Phone</span>
            <input
              name="phone"
              defaultValue={context.profile.phone}
              required
              placeholder=" 98765 43210"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <div className="rounded-3xl bg-[var(--panel-soft)] px-4 py-4 text-sm text-[var(--muted-ink)]">
            Email: <span className="font-medium text-[var(--brand-ink)]">{context.profile.email}</span>
          </div>
          <SubmitButton>Save profile</SubmitButton>
        </form>
      </section>
    </>
  );
}
