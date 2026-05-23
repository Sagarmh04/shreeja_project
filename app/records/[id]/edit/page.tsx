import { notFound } from "next/navigation";

import { DashboardShell } from "@/app/_components/dashboard-shell";
import { RecordForm } from "@/app/_components/record-form";
import { SetupNotice } from "@/app/_components/setup-notice";
import { updateRecordAction } from "@/app/actions/records";
import { requireAuth } from "@/lib/auth";
import { hasDatabaseEnv, hasSupabaseClientEnv } from "@/lib/env";
import { getRecordById } from "@/lib/records";

type EditRecordPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRecordPage({ params }: EditRecordPageProps) {
  if (!hasSupabaseClientEnv() || !hasDatabaseEnv()) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <SetupNotice message="The record editor is ready, but saving will start working after you replace the __REPLACE_ME__ values in .env.local." />
      </main>
    );
  }

  const { id } = await params;
  const { profile } = await requireAuth();
  const data = await getRecordById(id, profile.id);

  if (!data) {
    notFound();
  }

  return (
    <DashboardShell
      eyebrow="Edit record"
      title={`Update ${data.record.title}`}
      description="Adjust the details, replace the description, or add more attachments."
      profileName={profile.fullName}
      adminLink={profile.isAdmin}
    >
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
        <RecordForm
          action={updateRecordAction.bind(null, data.record.id)}
          submitLabel="Save changes"
          defaultValues={{
            title: data.record.title,
            category: data.record.category,
            description: data.record.description,
            quickFacts: data.record.quickFacts,
          }}
        />
      </div>
    </DashboardShell>
  );
}
