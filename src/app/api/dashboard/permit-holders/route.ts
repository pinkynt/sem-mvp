import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
import { upsertPermitHolder } from "@/server/dashboard/commands";
import { getPermitHolders } from "@/server/dashboard/queries";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDashboardUser(); return Response.json(await getPermitHolders()); } catch (error) { return dashboardApiError(error); } }
export async function POST(request: Request) { try { const user = await requireDashboardUser(); return Response.json(await upsertPermitHolder(await request.json(), user.id), { status: 201 }); } catch (error) { return dashboardApiError(error, "No se pudo guardar el permisionario. Revisá los datos e intentá nuevamente."); } }
