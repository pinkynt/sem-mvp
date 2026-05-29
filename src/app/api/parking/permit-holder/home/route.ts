import { readPermitHolderSession } from "@/server/permisionario/auth";
import { getPermitHolderHome } from "@/server/parking/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readPermitHolderSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(
      await getPermitHolderHome({ permitHolderId: session.permitHolderId }),
    );
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected parking API error";
}
