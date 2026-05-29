import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDashboardUser(); return Response.json({ enabled: false, fallback: "polling", intervalMs: 15000 }); } catch (error) { return dashboardApiError(error); } }
