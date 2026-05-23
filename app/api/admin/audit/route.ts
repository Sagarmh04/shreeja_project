import { requireAdmin } from "@/lib/auth";
import { getAuditLogs } from "@/lib/audit";

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const logs = await getAuditLogs({
    action: searchParams.get("action") ?? undefined,
    user: searchParams.get("user") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  return Response.json({ logs });
}
