import { DashboardShell } from "@/app/_components/dashboard-shell";
import { ProfileForm } from "@/app/_components/profile-form";
import { SetupNotice } from "@/app/_components/setup-notice";
import { updateProfileAction } from "@/app/actions/profile";
import { requireAuth } from "@/lib/auth";
import { hasDatabaseEnv, hasSupabaseClientEnv } from "@/lib/env";

export default async function SettingsPage() {
  if (!hasSupabaseClientEnv() || !hasDatabaseEnv()) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <SetupNotice message="The profile screen is ready, but saving will start working after you replace the __REPLACE_ME__ values in .env.local." />
      </main>
    );
  }

  const { profile } = await requireAuth();

  return (
    <DashboardShell
      eyebrow="Profile"
      title="Your profile settings"
      description="Keep your basic account details current."
      profileName={profile.fullName}
      adminLink={profile.isAdmin}
    >
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
        <ProfileForm
          action={updateProfileAction}
          defaultValues={{
            fullName: profile.fullName,
            avatarUrl: profile.avatarUrl,
          }}
        />
      </div>
    </DashboardShell>
  );
}
