import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
import { upsertZone } from "@/server/dashboard/commands";
import { getAdminZones } from "@/server/dashboard/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDashboardUser();
    return Response.json(await getAdminZones());
  } catch (error) {
    return dashboardApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireDashboardUser();
    return Response.json(await upsertZone(await request.json()), { status: 201 });
  } catch (error) {
    return dashboardApiError(error, "No se pudo guardar la zona. Revisá los datos e intentá nuevamente.");
  }
}
