import { getParkingPaymentTicketByExternalId } from "@/server/parking-payment-tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ externalId: string }> },
) {
  const { externalId } = await params;
  const ticket = await getParkingPaymentTicketByExternalId(externalId);

  if (!ticket) {
    return Response.json({ error: "Payment ticket not found" }, { status: 404 });
  }

  return Response.json({ ticket });
}
