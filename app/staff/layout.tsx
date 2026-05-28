import { PortalShell } from "@/components/portal-shell";
import { requireStaffContext } from "@/lib/auth";

const staffNav = [{ href: "/staff", label: "Orders" }];

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireStaffContext();

  return (
    <PortalShell
      title="Order Desk"
      subtitle="Create customer orders quickly and review your own order history."
      navItems={staffNav}
      roleLabel="Employee Portal"
      userName={context.profile.name}
      profileHref="/staff/profile"
    >
      {children}
    </PortalShell>
  );
}
