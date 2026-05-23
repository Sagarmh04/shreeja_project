import { redirect } from "next/navigation";

import { AuthForm } from "@/app/_components/auth-form";
import { SetupNotice } from "@/app/_components/setup-notice";
import { loginAction } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseEnv, hasSupabaseClientEnv } from "@/lib/env";

export default async function LoginPage() {
  if (hasSupabaseClientEnv() && hasDatabaseEnv()) {
    const user = await getSessionUser();
    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[36px] bg-[linear-gradient(135deg,#102033_0%,#0d9488_120%)] p-8 text-white shadow-[0_30px_100px_rgba(15,23,42,0.18)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
            Northstar Care
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">
            Welcome back to your care portal.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-8 text-white/78">
            Review your information, update personal details, and keep your key
            references ready for every visit.
          </p>
        </div>
        <div className="space-y-5">
          {!hasSupabaseClientEnv() || !hasDatabaseEnv() ? (
            <SetupNotice message="Before sign-in can work, replace the __REPLACE_ME__ values in .env.local with your real Supabase and database credentials." />
          ) : null}
          <AuthForm
            mode="login"
            title="Member sign in"
            description="Pick up where you left off and manage your care details in a few clicks."
            action={loginAction}
          />
        </div>
      </div>
    </main>
  );
}
