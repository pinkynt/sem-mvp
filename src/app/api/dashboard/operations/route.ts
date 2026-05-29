import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
import { getOperations } from "@/server/dashboard/queries";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireDashboardUser(); const url = new URL(request.url); return Response.json(await getOperations({ status: url.searchParams.get("status") as never || "all", method: url.searchParams.get("method") as never || "all", plate: url.searchParams.get("plate") ?? undefined, from: url.searchParams.get("from") ?? undefined, to: url.searchParams.get("to") ?? undefined })); } catch (error) { return dashboardApiError(error); } }
