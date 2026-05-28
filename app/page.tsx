import { ArrowRight, ShieldCheck, Store, UserRound } from "lucide-react";

import { signInAction } from "@/app/actions";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { redirectSignedInUser } from "@/lib/auth";

type HomePageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  await redirectSignedInUser();
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-8 px-4 py-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-6">
      <section className="rounded-[2.5rem] border border-[var(--line)] bg-[var(--panel)] p-8 shadow-[0_30px_90px_rgba(16,32,51,0.08)] lg:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.42em] text-[var(--accent-deep)]">
          Northern Star
        </p>
        <h1 className="mt-4 max-w-xl text-5xl leading-tight font-semibold text-[var(--brand-ink)]">
          Store operations, staff coordination, and traceable activity in one place.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-ink)]">
          Built for a growing retail team that needs a cleaner way to manage staff accounts, maintain the product catalog, and keep orders moving without losing visibility.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel-soft)] p-5">
            <Store className="h-6 w-6 text-[var(--accent-deep)]" />
            <h2 className="mt-4 text-lg font-semibold">Catalog clarity</h2>
            <p className="mt-2 text-sm text-[var(--muted-ink)]">
              Keep pricing, availability, and store details current from a single operational workspace.
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel-soft)] p-5">
            <UserRound className="h-6 w-6 text-[var(--accent-deep)]" />
            <h2 className="mt-4 text-lg font-semibold">Faster order desk</h2>
            <p className="mt-2 text-sm text-[var(--muted-ink)]">
              Let staff handle customer orders quickly while keeping each user focused on their own work.
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel-soft)] p-5">
            <ShieldCheck className="h-6 w-6 text-[var(--accent-deep)]" />
            <h2 className="mt-4 text-lg font-semibold">Clear accountability</h2>
            <p className="mt-2 text-sm text-[var(--muted-ink)]">
              Important actions are easy to review, helping the business stay organized as the team grows.
            </p>
          </div>
        </div>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--brand-ink)] px-5 py-3 text-sm font-medium text-white">
          Northern Star operations portal
          <ArrowRight className="h-4 w-4" />
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-[var(--line)] bg-[var(--panel)] p-8 shadow-[0_30px_90px_rgba(16,32,51,0.08)] lg:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--accent-deep)]">
            Sign in
          </p>
          <h2 className="text-3xl font-semibold">Access your portal</h2>
          <p className="text-sm leading-6 text-[var(--muted-ink)]">
            Use your work credentials to continue. Staff access is provisioned by the store administrator.
          </p>
        </div>

        <div className="mt-6">
          <StatusBanner status={params.status} message={params.message} />
        </div>

        <form action={signInAction} className="mt-6 space-y-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Email</span>
            <input
              name="email"
              type="email"
              required
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              placeholder="name@northernstar.com"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-[var(--muted-ink)]">Password</span>
            <input
              name="password"
              type="password"
              required
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              placeholder="Enter your password"
            />
          </label>
          <SubmitButton className="w-full rounded-full bg-[var(--brand-ink)] px-4 py-3 font-medium text-white transition hover:bg-[#19324f] disabled:cursor-not-allowed disabled:opacity-60">
            Sign in
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
