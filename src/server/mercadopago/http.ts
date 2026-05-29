import { getMercadoPagoConfig } from "./config";

const MERCADOPAGO_API_BASE_URL = "https://api.mercadopago.com";

export class MercadoPagoApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly response: unknown,
  ) {
    super(message);
  }
}

type MercadoPagoRequestOptions = {
  method: "GET" | "POST" | "PUT";
  body?: unknown;
  idempotencyKey?: string;
};

export async function mercadoPagoRequest<T>(
  path: string,
  options: MercadoPagoRequestOptions,
): Promise<T> {
  const { accessToken } = getMercadoPagoConfig();
  const headers = new Headers({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  });

  if (options.idempotencyKey) {
    headers.set("X-Idempotency-Key", options.idempotencyKey);
  }

  const response = await fetch(`${MERCADOPAGO_API_BASE_URL}${path}`, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const rawBody = await response.text();
  const parsedBody = parseJsonResponse(rawBody);

  if (!response.ok) {
    throw new MercadoPagoApiError(
      `MercadoPago request failed with status ${response.status}`,
      response.status,
      parsedBody,
    );
  }

  return parsedBody as T;
}

function parseJsonResponse(rawBody: string) {
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}
