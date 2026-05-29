import QRCode from "qrcode";
import { getMercadoPagoConfig } from "./config";
import { mercadoPagoRequest } from "./http";
import type { MercadoPagoQrMode, MercadoPagoQrOrderResponse } from "./types";

const EXTERNAL_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export type CreateMercadoPagoQrOrderInput = {
  amount: number | string;
  description: string;
  externalId: string;
  expirationTime?: string;
  mode?: MercadoPagoQrMode;
  idempotencyKey?: string;
};

export type CreatedMercadoPagoQrOrder = {
  orderId: string;
  paymentId?: string;
  externalId?: string;
  amount?: string;
  description?: string;
  status?: string;
  statusDetail?: string;
  qrData: string;
  qrImageDataUrl: string;
  raw: MercadoPagoQrOrderResponse;
};

export async function createMercadoPagoQrOrder({
  amount,
  description,
  externalId,
  expirationTime = "PT15M",
  mode = "dynamic",
  idempotencyKey = externalId,
}: CreateMercadoPagoQrOrderInput): Promise<CreatedMercadoPagoQrOrder> {
  const normalizedAmount = normalizeAmount(amount);
  const normalizedDescription = normalizeDescription(description);
  const normalizedExternalId = normalizeExternalId(externalId);
  const { posExternalId } = getMercadoPagoConfig();

  const order = await mercadoPagoRequest<MercadoPagoQrOrderResponse>(
    "/v1/orders",
    {
      method: "POST",
      idempotencyKey,
      body: {
        type: "qr",
        total_amount: normalizedAmount,
        description: normalizedDescription,
        external_reference: normalizedExternalId,
        expiration_time: expirationTime,
        config: {
          qr: {
            external_pos_id: posExternalId,
            mode,
          },
        },
        transactions: {
          payments: [{ amount: normalizedAmount }],
        },
        items: [
          {
            title: normalizedDescription,
            unit_price: normalizedAmount,
            quantity: 1,
            unit_measure: "unit",
          },
        ],
      },
    },
  );

  const qrData = order.type_response?.qr_data;
  if (!qrData) {
    throw new Error("MercadoPago did not return QR data for the order");
  }

  return {
    orderId: order.id,
    paymentId: order.transactions?.payments?.[0]?.id,
    externalId: order.external_reference,
    amount: order.total_amount,
    description: order.description,
    status: order.status,
    statusDetail: order.status_detail,
    qrData,
    qrImageDataUrl: await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 6,
    }),
    raw: order,
  };
}

export async function getMercadoPagoQrOrder(
  orderId: string,
): Promise<MercadoPagoQrOrderResponse> {
  if (!orderId.startsWith("ORD")) {
    throw new Error("Invalid MercadoPago order ID");
  }

  return mercadoPagoRequest<MercadoPagoQrOrderResponse>(`/v1/orders/${orderId}`, {
    method: "GET",
  });
}

export function normalizeAmount(amount: number | string): string {
  const stringAmount = String(amount).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(stringAmount)) {
    throw new Error("Amount must be a positive number with up to two decimals");
  }

  const numericAmount = Number(stringAmount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  return numericAmount.toFixed(2);
}

function normalizeDescription(description: string): string {
  const normalizedDescription = description.trim();

  if (!normalizedDescription) {
    throw new Error("Description is required");
  }

  if (normalizedDescription.length > 150) {
    throw new Error("Description must be 150 characters or fewer");
  }

  return normalizedDescription;
}

function normalizeExternalId(externalId: string): string {
  const normalizedExternalId = externalId.trim();

  if (!EXTERNAL_REFERENCE_PATTERN.test(normalizedExternalId)) {
    throw new Error(
      "External ID must be 1-64 chars and use only letters, numbers, hyphen, or underscore",
    );
  }

  return normalizedExternalId;
}
