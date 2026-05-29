import { authorizeDemoMutation } from "@/server/parking/demo-guard";
import { getParkingSession } from "@/server/parking/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorizationError = authorizeDemoMutation(request);
  if (authorizationError) return authorizationError;

  try {
    const { id } = await params;
    return Response.json(await getParkingSession(id));
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected parking API error";
}
