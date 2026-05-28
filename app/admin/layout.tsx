import { PortalShell } from "@/components/portal-shell";
import { requireAdminContext } from "@/lib/auth";

const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/items", label: "Items" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/profile", label: "Store Profile" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAdminContext();

  return (
    <PortalShell
      title="Admin Portal"
      subtitle="Manage the Northern Star store, catalog, staff accounts, and the audit trail from one place."
      navItems={adminNav}
      roleLabel="Manager / Admin"
      userName={context.profile?.name ?? "Admin"}
      profileHref="/admin/profile"
    >
      {children}
    </PortalShell>
  );
}
