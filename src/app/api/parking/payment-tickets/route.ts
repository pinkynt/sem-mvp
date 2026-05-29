import { readPermitHolderSession } from "@/server/permisionario/auth";
import { createParkingPaymentQrTicket } from "@/server/parking-payment-tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreatePaymentTicketBody = {
  amount?: number | string;
  description?: string;
  externalId?: string;
};

export async function POST(request: Request) {
  const session = await readPermitHolderSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreatePaymentTicketBody;

  if (!body.amount || !body.description || !body.externalId) {
    return Response.json(
      { error: "amount, description, and externalId are required" },
      { status: 400 },
    );
  }

  try {
    const result = await createParkingPaymentQrTicket({
      amount: body.amount,
      description: body.description,
      externalId: body.externalId,
    });

    return Response.json(
      {
        ticket: result.ticket,
        qr: {
          orderId: result.qr.orderId,
          paymentId: result.qr.paymentId,
          qrData: result.qr.qrData,
          qrImageDataUrl: result.qr.qrImageDataUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create parking payment ticket",
      },
      { status: 500 },
    );
  }
}
