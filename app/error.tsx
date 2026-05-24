"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--canvas)] text-[var(--brand-ink)] antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full rounded-[32px] border border-white/60 bg-white/92 p-8 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
              Server error
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              The page could not finish loading.
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-ink)]">
              Your session may still be valid. Retry the page, or go back to the
              dashboard entry points below.
            </p>
            {error.digest ? (
              <p className="mt-4 rounded-2xl bg-[var(--panel-soft)] px-4 py-3 text-xs font-medium text-[var(--muted-ink)]">
                Digest: {error.digest}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand-ink)] px-5 text-sm font-semibold text-white"
              >
                Retry
              </button>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--brand-ink)]"
              >
                Open dashboard
              </Link>
              <Link
                href="/records"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--brand-ink)]"
              >
                Open records
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
