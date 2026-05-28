"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

type SidebarNavProps = {
  items: NavItem[];
};

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mt-10 flex flex-1 flex-col gap-2">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && item.href !== "/staff" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={`rounded-2xl px-4 py-3 text-sm transition ${
              active
                ? "border border-[var(--line)] bg-white font-medium text-[var(--brand-ink)] shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
                : "border border-transparent text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-soft)] hover:text-[var(--brand-ink)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
