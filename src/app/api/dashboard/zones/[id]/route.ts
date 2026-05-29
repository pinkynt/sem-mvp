import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
import { deleteZone, upsertZone } from "@/server/dashboard/commands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireDashboardUser();
    const { id } = await params;
    return Response.json(await upsertZone({ ...(await request.json()), id }));
  } catch (error) {
    return dashboardApiError(error, "No se pudieron guardar los cambios de la zona.");
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireDashboardUser();
    const { id } = await params;
    await deleteZone(id);
    return Response.json({ ok: true });
  } catch (error) {
    return dashboardApiError(error, "No se pudo borrar la zona.");
  }
}
