import { createAdminClient } from "@/utils/supabase/admin";
import {
  createMercadoPagoQrOrder,
  type CreatedMercadoPagoQrOrder,
  type CreateMercadoPagoQrOrderInput,
} from "./mercadopago/qr-orders";
import type { MercadoPagoQrOrderResponse } from "./mercadopago/types";

const TABLE_NAME = "parking_payment_tickets";

export type ParkingPaymentTicketStatus =
  | "pending"
  | "paid"
  | "expired"
  | "cancelled"
  | "refunded"
  | "failed";

export type ParkingPaymentTicket = {
  id: string;
  externalId: string;
  mercadoPagoOrderId: string | null;
  mercadoPagoPaymentId: string | null;
  amount: string;
  description: string;
  status: ParkingPaymentTicketStatus;
  statusDetail: string | null;
  qrData: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  rawProviderPayload?: unknown;
};

type ParkingPaymentTicketRow = {
  id: string;
  external_id: string;
  mercado_pago_order_id: string | null;
  mercado_pago_payment_id: string | null;
  amount: string;
  description: string;
  status: ParkingPaymentTicketStatus;
  status_detail: string | null;
  qr_data: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  provider_payload?: unknown;
};

export async function createParkingPaymentQrTicket(
  input: Pick<CreateMercadoPagoQrOrderInput, "amount" | "description" | "externalId">,
) {
  const existingTicket = await getParkingPaymentTicketByExternalId(
    input.externalId,
  );

  if (existingTicket?.qrData) {
    return {
      ticket: existingTicket,
      qr: await createQrResponseFromExistingTicket(existingTicket),
    };
  }

  await insertPendingParkingPaymentTicket(input);

  const qrOrder = await createMercadoPagoQrOrder(input);
  const ticket = await updateTicketFromCreatedOrder(input.externalId, qrOrder);

  return { ticket, qr: qrOrder };
}

export async function getParkingPaymentTicketByExternalId(
  externalId: string,
): Promise<ParkingPaymentTicket | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("external_id", externalId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapTicketRow(data as ParkingPaymentTicketRow) : null;
}

export async function syncParkingPaymentTicketFromMercadoPagoOrder(
  order: MercadoPagoQrOrderResponse,
): Promise<ParkingPaymentTicket> {
  const externalId = order.external_reference;

  if (!externalId) {
    throw new Error("MercadoPago order is missing external_reference");
  }

  const payment = order.transactions?.payments?.[0];
  const status = mapMercadoPagoOrderStatus(order);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(
      {
        external_id: externalId,
        mercado_pago_order_id: order.id,
        mercado_pago_payment_id: payment?.id ?? null,
        amount: order.total_amount ?? payment?.amount ?? "0.00",
        description: order.description ?? "MercadoPago QR order",
        status,
        status_detail: order.status_detail ?? payment?.status_detail ?? null,
        provider_payload: order,
        paid_at: status === "paid" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "external_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTicketRow(data as ParkingPaymentTicketRow);
}

async function insertPendingParkingPaymentTicket(
  input: Pick<CreateMercadoPagoQrOrderInput, "amount" | "description" | "externalId">,
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from(TABLE_NAME).insert({
    external_id: input.externalId,
    amount: String(input.amount),
    description: input.description,
    status: "pending",
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

async function updateTicketFromCreatedOrder(
  externalId: string,
  qrOrder: CreatedMercadoPagoQrOrder,
): Promise<ParkingPaymentTicket> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      mercado_pago_order_id: qrOrder.orderId,
      mercado_pago_payment_id: qrOrder.paymentId ?? null,
      amount: qrOrder.amount,
      description: qrOrder.description,
      status: mapMercadoPagoOrderStatus(qrOrder.raw),
      status_detail: qrOrder.statusDetail ?? null,
      qr_data: qrOrder.qrData,
      provider_payload: qrOrder.raw,
      updated_at: new Date().toISOString(),
    })
    .eq("external_id", externalId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTicketRow(data as ParkingPaymentTicketRow);
}

async function createQrResponseFromExistingTicket(
  ticket: ParkingPaymentTicket,
): Promise<CreatedMercadoPagoQrOrder> {
  const QRCode = await import("qrcode");

  return {
    orderId: ticket.mercadoPagoOrderId ?? "",
    paymentId: ticket.mercadoPagoPaymentId ?? undefined,
    externalId: ticket.externalId,
    amount: ticket.amount,
    description: ticket.description,
    status: ticket.status,
    statusDetail: ticket.statusDetail ?? undefined,
    qrData: ticket.qrData ?? "",
    qrImageDataUrl: await QRCode.toDataURL(ticket.qrData ?? "", {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 6,
    }),
    raw: (ticket.rawProviderPayload ?? {}) as MercadoPagoQrOrderResponse,
  };
}

function mapMercadoPagoOrderStatus(
  order: MercadoPagoQrOrderResponse,
): ParkingPaymentTicketStatus {
  if (order.status_detail === "partially_refunded") {
    return "refunded";
  }

  if (order.status === "processed" && order.status_detail === "accredited") {
    return "paid";
  }

  if (order.status === "expired") {
    return "expired";
  }

  if (order.status === "canceled" || order.status === "cancelled") {
    return "cancelled";
  }

  if (order.status === "refunded") {
    return "refunded";
  }

  if (order.status === "failed") {
    return "failed";
  }

  return "pending";
}

function mapTicketRow(row: ParkingPaymentTicketRow): ParkingPaymentTicket {
  return {
    id: row.id,
    externalId: row.external_id,
    mercadoPagoOrderId: row.mercado_pago_order_id,
    mercadoPagoPaymentId: row.mercado_pago_payment_id,
    amount: row.amount,
    description: row.description,
    status: row.status,
    statusDetail: row.status_detail,
    qrData: row.qr_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paidAt: row.paid_at,
    rawProviderPayload: row.provider_payload,
  };
}
