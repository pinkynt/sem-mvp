import { readPermitHolderSession } from "@/server/permisionario/auth";
import { getPaymentStatus } from "@/server/parking/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await readPermitHolderSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    return Response.json(
      await getPaymentStatus(id, session.permitHolderId),
    );
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message === "Forbidden" ? 403 : 404;
    return Response.json({ error: message }, { status });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected parking API error";
}
