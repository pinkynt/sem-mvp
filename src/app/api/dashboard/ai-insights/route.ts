import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
import { getDashboardAiInsights } from "@/server/dashboard/ai-insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDashboardUser();
    return Response.json(await getDashboardAiInsights());
  } catch (error) {
    return dashboardApiError(error);
  }
}
