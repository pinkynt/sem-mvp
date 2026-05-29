import { getMercadoPagoConfig } from "@/server/mercadopago/config";
import { getMercadoPagoQrOrder } from "@/server/mercadopago/qr-orders";
import type {
  MercadoPagoOrderWebhookBody,
  MercadoPagoQrOrderResponse,
} from "@/server/mercadopago/types";
import { verifyMercadoPagoWebhookSignature } from "@/server/mercadopago/webhooks";
import { applyMercadoPagoOrderToPayment } from "@/server/parking/domain";
import { syncParkingPaymentTicketFromMercadoPagoOrder } from "@/server/parking-payment-tickets";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const body = parseWebhookBody(rawBody);

  if (!body) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const queryDataId = request.nextUrl.searchParams.get("data.id");
  const orderId = queryDataId ?? body.data?.id;

  if (!orderId) {
    return Response.json({ error: "Missing MercadoPago order ID" }, { status: 400 });
  }

  const { webhookSecret } = getMercadoPagoConfig();
  if (webhookSecret) {
    const isValidSignature = verifyMercadoPagoWebhookSignature({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId: orderId,
      secret: webhookSecret,
    });

    if (!isValidSignature) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  if (body.type !== "order" && !body.action?.startsWith("order.")) {
    return Response.json({ received: true }, { status: 200 });
  }

  try {
    const order = await resolveWebhookOrder(body, orderId);
    await applyMercadoPagoOrderToPayment(order);

    await syncParkingPaymentTicketFromMercadoPagoOrder(order);

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process MercadoPago webhook",
      },
      { status: 500 },
    );
  }
}

async function resolveWebhookOrder(
  body: MercadoPagoOrderWebhookBody,
  orderId: string,
): Promise<MercadoPagoQrOrderResponse> {
  if (isEmbeddedOrder(body.data)) {
    return { ...body.data, id: body.data.id ?? orderId };
  }

  return getMercadoPagoQrOrder(orderId);
}

function isEmbeddedOrder(
  data: MercadoPagoOrderWebhookBody["data"],
): data is Partial<MercadoPagoQrOrderResponse> & { id?: string } {
  return Boolean(
    data &&
      (data.external_reference ||
        data.status ||
        data.status_detail ||
        data.total_paid_amount ||
        data.transactions),
  );
}

function parseWebhookBody(rawBody: string): MercadoPagoOrderWebhookBody | null {
  try {
    return JSON.parse(rawBody) as MercadoPagoOrderWebhookBody;
  } catch {
    return null;
  }
}
