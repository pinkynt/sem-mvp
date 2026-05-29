import { z } from "zod";
import { dashboardApiError, requireDashboardUser } from "@/server/dashboard/auth";
import { askDashboardAiAssistant } from "@/server/dashboard/ai-insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const chatSchema = z.object({
  message: z.string().trim().min(1, "Escribí una pregunta para el asistente.").max(500, "La pregunta es demasiado larga."),
});

export async function POST(request: Request) {
  try {
    await requireDashboardUser();
    const input = chatSchema.parse(await request.json());
    return Response.json(await askDashboardAiAssistant(input.message));
  } catch (error) {
    return dashboardApiError(error);
  }
}
