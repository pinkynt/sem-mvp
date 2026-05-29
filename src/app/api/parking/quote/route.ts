import type { ParkingQuoteRequest } from "@/contracts/parking";
import { authorizeDemoMutation } from "@/server/parking/demo-guard";
import { quoteParkingPayment } from "@/server/parking/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorizationError = authorizeDemoMutation(request);
  if (authorizationError) return authorizationError;

  try {
    const body = (await request.json()) as ParkingQuoteRequest;
    return Response.json(await quoteParkingPayment(body));
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected parking API error";
}
