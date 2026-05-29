import type { PaymentMethod } from "@/contracts/parking";
import { authorizeDemoMutation } from "@/server/parking/demo-guard";
import { quoteCloseSession } from "@/server/parking/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorizationError = authorizeDemoMutation(request);
  if (authorizationError) return authorizationError;

  try {
    const { id } = await params;
    const body = (await request.json()) as { method: PaymentMethod };
    return Response.json(await quoteCloseSession(id, body.method));
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected parking API error";
}
