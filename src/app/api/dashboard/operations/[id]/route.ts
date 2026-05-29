import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
import { getOperation } from "@/server/dashboard/queries";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireDashboardUser(); const { id } = await params; return Response.json(await getOperation(id)); } catch (error) { return dashboardApiError(error); } }
