import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/app/_components/button";
import { logoutAction } from "@/app/actions/auth";

type DashboardShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  profileName: string;
  children: ReactNode;
  adminLink?: boolean;
  settingsLink?: boolean;
};

export function DashboardShell({
  title,
  eyebrow,
  description,
  profileName,
  children,
  adminLink,
  settingsLink = true,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-white/60 bg-white/92 px-5 py-4 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--brand-ink)]">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-ink)]">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--panel-soft)] px-4 py-2 text-sm font-medium text-[var(--brand-ink)]">
                {profileName}
              </span>
              <Link href="/dashboard">
                <Button variant="ghost">Overview</Button>
              </Link>
              <Link href="/records">
                <Button variant="ghost">Records</Button>
              </Link>
              {settingsLink ? (
                <Link href="/settings">
                  <Button variant="ghost">Profile</Button>
                </Link>
              ) : null}
              {adminLink ? (
                <Link href="/admin">
                  <Button variant="secondary">Admin dashboard</Button>
                </Link>
              ) : null}
              <form action={logoutAction}>
                <Button type="submit">Sign out</Button>
              </form>
            </div>
          </div>
        </header>
        <main className="mt-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
