import Link from "next/link";
import { ShieldCheck, SearchCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/app/_components/button";
import { SetupNotice } from "@/app/_components/setup-notice";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseEnv, hasSupabaseClientEnv } from "@/lib/env";

const highlights = [
  {
    title: "Fast personal workspace",
    copy: "Customers get a calm place to keep their important details organized and easy to update.",
    icon: Sparkles,
  },
  {
    title: "Clean activity oversight",
    copy: "Monitoring stays in the background so the product feels natural while still capturing the needed trace.",
    icon: SearchCheck,
  },
  {
    title: "Built for trust",
    copy: "Next.js, Supabase, and Drizzle keep the experience fast while preserving a clear data structure.",
    icon: ShieldCheck,
  },
];

export default async function HomePage() {
  if (hasSupabaseClientEnv() && hasDatabaseEnv()) {
    const user = await getSessionUser();
    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-white/60 bg-white/85 px-6 py-5 shadow-[0_30px_110px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--accent-deep)]">
                QuietLedger
              </p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-[var(--brand-ink)] sm:text-6xl">
                Personal data made simple for customers, visible for administrators, and calm on the surface.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-ink)]">
                This school project focuses on a smooth customer experience first:
                quick sign-in, tidy records, elegant forms, and a monitoring layer
                that stays completely out of the way.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/signup">
                <Button className="w-full sm:w-auto lg:w-52">Create account</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="w-full sm:w-auto lg:w-52">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {!hasSupabaseClientEnv() || !hasDatabaseEnv() ? (
          <div className="mt-6">
            <SetupNotice message="The project scaffold is ready, but your real Supabase URL, publishable key, service role key, and database URL still need to replace the __REPLACE_ME__ placeholders in .env.local." />
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {highlights.map(({ title, copy, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[32px] border border-white/60 bg-[var(--panel)] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--panel-soft)] text-[var(--accent-deep)]">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-ink)]">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
