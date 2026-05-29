import type { PaymentMethod } from "@/contracts/parking";
import { readPermitHolderSession } from "@/server/permisionario/auth";
import { quoteCloseSession } from "@/server/parking/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await readPermitHolderSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { method: PaymentMethod };
    return Response.json(
      await quoteCloseSession({
        permitHolderId: session.permitHolderId,
        sessionId: id,
        method: body.method,
      }),
    );
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected parking API error";
}
