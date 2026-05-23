import { redirect } from "next/navigation";

import { AuthForm } from "@/app/_components/auth-form";
import { SetupNotice } from "@/app/_components/setup-notice";
import { signupAction } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseEnv, hasSupabaseClientEnv } from "@/lib/env";

export default async function SignupPage() {
  if (hasSupabaseClientEnv() && hasDatabaseEnv()) {
    const user = await getSessionUser();
    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          {!hasSupabaseClientEnv() || !hasDatabaseEnv() ? (
            <SetupNotice message="Before account creation can work, replace the __REPLACE_ME__ values in .env.local with your final Supabase and database credentials." />
          ) : null}
          <AuthForm
            mode="signup"
            title="Create your workspace"
            description="Start with a lightweight account setup and keep your details in one polished place."
            action={signupAction}
          />
        </div>
        <div className="rounded-[36px] border border-white/60 bg-white/85 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
            What the first version includes
          </p>
          <div className="mt-6 grid gap-5">
            {[
              "Simple registration and login with Supabase Auth",
              "A customer dashboard with flexible personal record cards",
              "Attachment support through Supabase Storage",
              "A separate admin area for users and audit activity",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[28px] border border-[var(--line)] bg-[var(--panel-soft)] px-5 py-4 text-sm text-[var(--brand-ink)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
