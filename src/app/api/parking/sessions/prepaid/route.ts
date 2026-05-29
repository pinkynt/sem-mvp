import type { OpenPrepaidSessionRequest } from "@/contracts/parking";
import { readPermitHolderSession } from "@/server/permisionario/auth";
import { openPrepaidSession } from "@/server/parking/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await readPermitHolderSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as OpenPrepaidSessionRequest;
    return Response.json(
      await openPrepaidSession({ permitHolderId: session.permitHolderId, input: body }),
      { status: 201 },
    );
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected parking API error";
}
