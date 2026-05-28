import Link from "next/link";
import { UserCircle2 } from "lucide-react";

import { signOutAction } from "@/app/actions";
import { SidebarNav } from "@/components/sidebar-nav";
import { SubmitButton } from "@/components/submit-button";

type NavItem = {
  href: string;
  label: string;
};

type PortalShellProps = {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  profileHref: string;
  children: React.ReactNode;
};

export function PortalShell({
  title,
  subtitle,
  navItems,
  roleLabel,
  userName,
  profileHref,
  children,
}: PortalShellProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-72 shrink-0 rounded-2xl bg-[var(--sidebar)] px-5 py-6 ring-1 ring-inset ring-[var(--sidebar-line)] lg:flex lg:flex-col">
          <div>
            <p className="font-display text-2xl tracking-[0.18em] text-[var(--accent-deep)] uppercase">
              Northern Star
            </p>
            <p className="mt-3 text-sm text-[var(--sidebar-muted)]">{roleLabel}</p>
            <p className="mt-1 text-lg font-semibold text-[var(--sidebar-ink)]">{userName}</p>
          </div>

          <SidebarNav items={navItems} />

          <form action={signOutAction} className="mt-auto pt-4">
            <SubmitButton className="w-full rounded-xl border border-[var(--sidebar-line)] bg-white px-4 py-3 font-medium text-[var(--sidebar-ink)] transition hover:bg-[var(--sidebar-soft)] disabled:cursor-not-allowed disabled:opacity-60">
              Sign out
            </SubmitButton>
          </form>
        </aside>

        <div className="flex-1">
          <header className="border-b border-[var(--line)] pb-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent-deep)]">
                  {roleLabel}
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-[var(--brand-ink)]">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm text-[var(--muted-ink)]">{subtitle}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted-ink)] lg:hidden">
                  {userName}
                </div>
                <Link
                  href={profileHref}
                  prefetch={false}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--brand-ink)] transition hover:border-[var(--accent)]"
                >
                  <UserCircle2 className="h-4 w-4" />
                  Profile
                </Link>
                <form action={signOutAction} className="lg:hidden">
                  <SubmitButton className="rounded-full bg-[var(--brand-ink)] px-4 py-2 text-sm text-white transition hover:bg-[#19324f] disabled:cursor-not-allowed disabled:opacity-60">
                    Sign out
                  </SubmitButton>
                </form>
              </div>
            </div>
          </header>

          <main className="mt-6 space-y-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
