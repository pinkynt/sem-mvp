import type { CreateParkingPaymentRequest } from "@/contracts/parking";
import { authorizeDemoMutation } from "@/server/parking/demo-guard";
import { createPrepaidPayment } from "@/server/parking/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorizationError = authorizeDemoMutation(request);
  if (authorizationError) return authorizationError;

  try {
    const body = (await request.json()) as CreateParkingPaymentRequest;
    return Response.json(await createPrepaidPayment(body), { status: 201 });
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected parking API error";
}
