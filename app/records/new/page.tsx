import { DashboardShell } from "@/app/_components/dashboard-shell";
import { RecordForm } from "@/app/_components/record-form";
import { SetupNotice } from "@/app/_components/setup-notice";
import { createRecordAction } from "@/app/actions/records";
import { requireAuth } from "@/lib/auth";
import { hasDatabaseEnv, hasSupabaseClientEnv } from "@/lib/env";

export default async function NewRecordPage() {
  if (!hasSupabaseClientEnv() || !hasDatabaseEnv()) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <SetupNotice message="The record form is ready, but saving will start working after you replace the __REPLACE_ME__ values in .env.local." />
      </main>
    );
  }

  const { profile } = await requireAuth();

  return (
    <DashboardShell
      eyebrow="New record"
      title="Create a new record"
      description="Use this flexible format for contact details, emergency references, identity notes, or anything else that should stay easy to retrieve."
      profileName={profile.fullName}
      adminLink={profile.isAdmin}
    >
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
        <RecordForm action={createRecordAction} submitLabel="Save record" />
      </div>
    </DashboardShell>
  );
}
