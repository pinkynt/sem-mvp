import { createMercadoPagoQrOrder } from "@/server/mercadopago/qr-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const amount = url.searchParams.get("amount") ?? "10.00";
  const description =
    url.searchParams.get("description") ?? "SEM parking test QR";
  const externalId = url.searchParams.get("externalId") ?? crypto.randomUUID();
  const format = url.searchParams.get("format") ?? "html";

  try {
    const qrOrder = await createMercadoPagoQrOrder({
      amount,
      description,
      externalId,
    });

    if (format === "json") {
      return Response.json({
        orderId: qrOrder.orderId,
        paymentId: qrOrder.paymentId,
        externalId: qrOrder.externalId,
        amount: qrOrder.amount,
        description: qrOrder.description,
        status: qrOrder.status,
        statusDetail: qrOrder.statusDetail,
        qrData: qrOrder.qrData,
        qrImageDataUrl: qrOrder.qrImageDataUrl,
      });
    }

    return new Response(renderQrHtml(qrOrder), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create MercadoPago quick QR",
      },
      { status: 500 },
    );
  }
}

type RenderableQrOrder = Awaited<ReturnType<typeof createMercadoPagoQrOrder>>;

function renderQrHtml(qrOrder: RenderableQrOrder) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MercadoPago QR Test</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f4f5; color: #18181b; }
      main { width: min(92vw, 480px); border: 1px solid #e4e4e7; border-radius: 24px; padding: 28px; background: white; box-shadow: 0 10px 30px rgb(24 24 27 / 0.08); }
      img { display: block; width: min(100%, 320px); height: auto; margin: 20px auto; border: 1px solid #e4e4e7; border-radius: 16px; }
      dl { display: grid; grid-template-columns: 120px 1fr; gap: 8px 12px; font-size: 14px; }
      dt { color: #71717a; }
      dd { margin: 0; overflow-wrap: anywhere; }
      code { font-size: 12px; }
    </style>
  </head>
  <body>
    <main>
      <h1>MercadoPago QR Test</h1>
      <p>Scan this QR with a MercadoPago test buyer account.</p>
      <img alt="MercadoPago payable QR" src="${escapeHtml(qrOrder.qrImageDataUrl)}" />
      <dl>
        <dt>Order</dt><dd><code>${escapeHtml(qrOrder.orderId)}</code></dd>
        <dt>Payment</dt><dd><code>${escapeHtml(qrOrder.paymentId ?? "-")}</code></dd>
        <dt>External ID</dt><dd><code>${escapeHtml(qrOrder.externalId ?? "-")}</code></dd>
        <dt>Amount</dt><dd>${escapeHtml(qrOrder.amount ?? "-")}</dd>
        <dt>Status</dt><dd>${escapeHtml(qrOrder.status ?? "-")} / ${escapeHtml(qrOrder.statusDetail ?? "-")}</dd>
      </dl>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
