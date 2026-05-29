import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
import { csvResponse, toCsv } from "@/server/dashboard/csv";
import { getPermitHolders } from "@/server/dashboard/queries";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDashboardUser(); const rows = await getPermitHolders(); return csvResponse("permisionarios-sem.csv", toCsv(["Nombre", "Legajo", "Zona", "Activo", "Clave", "Cuenta activa"], rows.map((row) => [row.displayName, row.fileNumber, row.zoneName, row.active ? "sí" : "no", row.account?.username ?? "", row.account?.active ? "sí" : "no"]))); } catch (error) { return dashboardApiError(error); } }
