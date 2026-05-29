import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
import { createTariff } from "@/server/dashboard/commands";
import { getTariffs } from "@/server/dashboard/queries";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDashboardUser(); return Response.json(await getTariffs()); } catch (error) { return dashboardApiError(error); } }
export async function POST(request: Request) { try { await requireDashboardUser(); return Response.json(await createTariff(await request.json()), { status: 201 }); } catch (error) { return dashboardApiError(error); } }
export async function DELETE() { try { await requireDashboardUser(); return Response.json({ error: "Las tarifas no se eliminan: se desactivan al crear una nueva tarifa activa para preservar pagos históricos." }, { status: 405 }); } catch (error) { return dashboardApiError(error); } }
