import { provisionMercadoPagoQrPoint } from "@/server/mercadopago/provisioning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorizationError = authorizeProvisioningRequest(request);
  if (authorizationError) {
    return authorizationError;
  }

  try {
    const provisionedPoint = await provisionMercadoPagoQrPoint();
    return Response.json(provisionedPoint, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to provision MercadoPago QR point",
      },
      { status: 500 },
    );
  }
}

function authorizeProvisioningRequest(request: Request) {
  const expectedKey = process.env.MERCADOPAGO_PROVISIONING_KEY;

  if (!expectedKey) {
    return Response.json(
      { error: "Missing MERCADOPAGO_PROVISIONING_KEY environment variable" },
      { status: 503 },
    );
  }

  if (request.headers.get("x-provisioning-key") !== expectedKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
