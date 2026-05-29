import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
import { getLatestMovements } from "@/server/dashboard/queries";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDashboardUser(); return Response.json(await getLatestMovements()); } catch (error) { return dashboardApiError(error); } }
