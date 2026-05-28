import { createStaffAction, toggleStaffStatusAction, updateStaffAction } from "@/app/actions";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDateTime } from "@/lib/format";
import { getStaffMembers } from "@/lib/queries";

type AdminStaffPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminStaffPage({ searchParams }: AdminStaffPageProps) {
  const params = await searchParams;
  const staffMembers = await getStaffMembers();

  return (
    <>
      <StatusBanner status={params.status} message={params.message} />

      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_70px_rgba(16,32,51,0.05)]">
        <h2 className="text-2xl font-semibold">Create staff account</h2>
        <p className="mt-2 text-sm text-[var(--muted-ink)]">
          New team members are created here with a temporary password for first access.
        </p>

        <form action={createStaffAction} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Staff name</span>
            <input
              name="name"
              required
              placeholder="David Warner"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Staff ID</span>
            <input
              name="staffId"
              required
              placeholder="NST-1042"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Phone</span>
            <input
              name="phone"
              required
              placeholder=" 98765 43210"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="riya@northernstar.com"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Temporary password</span>
            <input
              name="password"
              type="password"
              required
              placeholder="Create a temporary password"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <div className="md:col-span-2 xl:col-span-5">
            <SubmitButton>Create staff account</SubmitButton>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {staffMembers.map((staff) => (
          <div
            key={staff.id}
            className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[0_20px_70px_rgba(16,32,51,0.05)]"
          >
            <div className="grid gap-4 xl:grid-cols-[1.8fr_auto]">
              <form action={updateStaffAction} className="grid gap-4 md:grid-cols-3">
                <input type="hidden" name="profileId" value={staff.id} />
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-[var(--muted-ink)]">Name</span>
                  <input
                    name="name"
                    defaultValue={staff.name}
                    required
                    placeholder="David Warner"
                    className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-[var(--muted-ink)]">Staff ID</span>
                  <input
                    name="staffId"
                    defaultValue={staff.staff_id ?? ""}
                    required
                    placeholder="NST-1042"
                    className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-[var(--muted-ink)]">Phone</span>
                  <input
                    name="phone"
                    defaultValue={staff.phone}
                    required
                    placeholder=" 98765 43210"
                    className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                  />
                </label>
                <div className="md:col-span-3 flex items-center justify-between gap-3 rounded-3xl bg-[var(--panel-soft)] px-4 py-3 text-sm text-[var(--muted-ink)]">
                  <div>
                    <div>{staff.email}</div>
                    <div>Created {formatDateTime(staff.created_at)}</div>
                  </div>
                  <SubmitButton>Save details</SubmitButton>
                </div>
              </form>

              <form action={toggleStaffStatusAction} className="flex items-end gap-3">
                <input type="hidden" name="profileId" value={staff.id} />
                <input type="hidden" name="nextActive" value={String(!staff.is_active)} />
                <div className="rounded-full bg-[var(--panel-soft)] px-4 py-3 text-sm text-[var(--muted-ink)]">
                  {staff.is_active ? "Active" : "Inactive"}
                </div>
                <SubmitButton className="rounded-full bg-transparent px-4 py-3 text-sm font-medium text-[var(--danger)] ring-1 ring-red-200 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                  {staff.is_active ? "Deactivate" : "Reactivate"}
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
