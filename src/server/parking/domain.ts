import { createAdminClient } from "@/utils/supabase/admin";
import { createMercadoPagoQrOrder } from "@/server/mercadopago/qr-orders";
import type {
  CloseParkingSessionResponse,
  CreateParkingPaymentRequest,
  CreateParkingPaymentResponse,
  OpenParkingSessionRequest,
  OpenParkingSessionResponse,
  OpenPrepaidSessionRequest,
  ParkingDashboardDto,
  ParkingPaymentStatusDto,
  ParkingQrDto,
  ParkingQuoteDto,
  ParkingQuoteRequest,
  ParkingReceiptDto,
  ParkingSessionDetailDto,
  ParkingSessionDto,
  PaymentDto,
  PaymentMethod,
  PaymentStatus,
  VehicleKind,
  VehicleTariffDto,
} from "@/contracts/parking";
import type { MercadoPagoQrOrderResponse } from "@/server/mercadopago/types";

type TariffRow = {
  id: string;
  zone_id: string;
  vehicle_kind: VehicleKind;
  label: string;
  hourly_rate_cents: number;
  digital_discount_percent: number;
};

type SessionRow = {
  id: string;
  zone_id: string;
  permit_holder_id: string;
  license_plate: string;
  vehicle_kind: VehicleKind;
  status: "active" | "closed";
  started_at: string;
  closed_at: string | null;
  kind: "prepago" | "pospago";
};

type PaymentRow = {
  id: string;
  zone_id: string;
  permit_holder_id: string;
  parking_session_id: string | null;
  license_plate: string;
  vehicle_kind: VehicleKind;
  method: PaymentMethod;
  status: PaymentStatus;
  amount_cents: number;
  base_amount_cents: number;
  discount_cents: number;
  duration_minutes: number;
  valid_until: string | null;
  confirmed_at: string | null;
  created_at: string;
};

type GatewayRefRow = {
  id: string;
  payment_id: string;
  provider: "mercadopago";
  provider_order_id: string | null;
  provider_payment_id: string | null;
  external_reference: string;
  qr_data: string | null;
  qr_image_data_url: string | null;
};

type PermitHolderContext = {
  permitHolder: {
    id: string;
    display_name: string;
    file_number: string;
    zone_id: string;
    zones: { id: string; name: string } | null;
  };
  tariffs: TariffRow[];
};

export function normalizeLicensePlate(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const isAutoMercosur = /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(normalized);
  const isAutoLegacy = /^[A-Z]{3}\d{3}$/.test(normalized);
  const isMotoMercosur = /^[A-Z]\d{3}[A-Z]{3}$/.test(normalized);
  if (!isAutoMercosur && !isAutoLegacy && !isMotoMercosur) {
    throw new Error("Patente o formato inválido");
  }
  return normalized;
}

export async function getPermitHolderHome(args: {
  permitHolderId: string;
}): Promise<ParkingDashboardDto> {
  const { permitHolder, tariffs } = await getPermitHolderContext(args);
  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ data: activeSessions, error: sessionsError }, { data: recentPayments, error: paymentsError }] =
    await Promise.all([
      supabase
        .from("parking_sessions")
        .select("*")
        .eq("permit_holder_id", permitHolder.id)
        .eq("status", "active")
        .order("started_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*")
        .eq("permit_holder_id", permitHolder.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  if (sessionsError) throw new Error(sessionsError.message);
  if (paymentsError) throw new Error(paymentsError.message);

  let activeSessionRows = (activeSessions ?? []) as SessionRow[];

  // Lazily close expired prepago sessions before returning the dashboard.
  activeSessionRows = await closeExpiredPrepaidSessions(activeSessionRows);

  // Batch-fetch linked payments for all remaining active sessions so we can
  // populate the auxiliary DTO fields (validUntil, paymentId, paymentStatus).
  const activeIds = activeSessionRows.map((s) => s.id);
  let linkedPaymentsBySessionId: Map<string, PaymentRow> = new Map();
  if (activeIds.length > 0) {
    const { data: linkedPayments, error: linkedError } = await supabase
      .from("payments")
      .select("*")
      .in("parking_session_id", activeIds)
      .in("status", ["pending", "confirmed"])
      .order("created_at", { ascending: false });
    if (linkedError) throw new Error(linkedError.message);
    // Keep only the most-recent payment per session (already ordered desc).
    for (const p of (linkedPayments ?? []) as PaymentRow[]) {
      if (p.parking_session_id && !linkedPaymentsBySessionId.has(p.parking_session_id)) {
        linkedPaymentsBySessionId.set(p.parking_session_id, p);
      }
    }
  }

  const paymentRows = (recentPayments ?? []) as PaymentRow[];
  const confirmedPayments = paymentRows.filter((payment) => payment.status === "confirmed");
  const todayPayments = confirmedPayments.filter(
    (payment) => new Date(payment.confirmed_at ?? payment.created_at) >= today,
  );

  return {
    permitHolder: {
      id: permitHolder.id,
      displayName: permitHolder.display_name,
      fileNumber: permitHolder.file_number,
      zone: {
        id: permitHolder.zones?.id ?? permitHolder.zone_id,
        name: permitHolder.zones?.name ?? "Zona asignada",
      },
    },
    tariffs: tariffs.map(mapTariff),
    totals: {
      todayAmountCents: todayPayments.reduce((sum, payment) => sum + payment.amount_cents, 0),
      todayCount: todayPayments.length,
      accumulatedAmountCents: confirmedPayments.reduce((sum, payment) => sum + payment.amount_cents, 0),
    },
    activeSessions: activeSessionRows.map((session) =>
      mapSession(session, tariffs, linkedPaymentsBySessionId.get(session.id)),
    ),
    recentPayments: paymentRows.map((payment) => mapPayment(payment)),
  };
}

export async function quoteParkingPayment(args: {
  permitHolderId: string;
  input: ParkingQuoteRequest;
}): Promise<ParkingQuoteDto> {
  const { tariffs } = await getPermitHolderContext({ permitHolderId: args.permitHolderId });
  const tariff = getTariff(tariffs, args.input.vehicleKind);
  const durationMinutes = args.input.sessionId
    ? await getSessionElapsedMinutes(args.input.sessionId)
    : Math.max(1, args.input.durationMinutes ?? 60);
  return buildQuote(tariff, args.input.method, durationMinutes);
}

export async function createPrepaidPayment(args: {
  permitHolderId: string;
  input: CreateParkingPaymentRequest;
}): Promise<CreateParkingPaymentResponse> {
  const input = args.input;
  const licensePlate = normalizeLicensePlate(input.licensePlate);
  const { permitHolder, tariffs } = await getPermitHolderContext({ permitHolderId: args.permitHolderId });
  const tariff = getTariff(tariffs, input.vehicleKind);
  // Pure prepago: always quote by durationMinutes (never by session elapsed time).
  const quote = buildQuote(tariff, input.method, input.durationMinutes ?? 60);
  const status = input.method === "cash" ? "confirmed" : "pending";
  const now = new Date().toISOString();
  const supabase = createAdminClient();

  if (input.sessionId) {
    const existingPayment = await getExistingClosePayment(input.sessionId);
    if (existingPayment) {
      const payment = mapPayment(existingPayment);
      const existingQuote = await quoteFromPayment(payment, tariffs);
      // Pure prepago: confirmed payment does NOT close the session.
      return {
        payment,
        quote: existingQuote,
        receipt: payment.status === "confirmed" ? buildReceipt(payment, existingQuote) : null,
        qr: await getPaymentQr(payment.id),
      };
    }
  }

  const insertResult = await insertPayment({
    zone_id: permitHolder.zone_id,
    permit_holder_id: permitHolder.id,
    parking_session_id: input.sessionId ?? null,
    license_plate: licensePlate,
    vehicle_kind: input.vehicleKind,
    method: input.method,
    status,
    amount_cents: quote.finalAmountCents,
    base_amount_cents: quote.baseAmountCents,
    discount_cents: quote.discountCents,
    duration_minutes: quote.durationMinutes,
    valid_until: quote.validUntil,
    confirmed_at: status === "confirmed" ? now : null,
  });

  if ("error" in insertResult) {
    if (input.sessionId && insertResult.code === "23505") {
      const existingPayment = await getExistingClosePayment(input.sessionId);
      if (existingPayment) {
        const payment = mapPayment(existingPayment);
        const existingQuote = await quoteFromPayment(payment, tariffs);
        return {
          payment,
          quote: existingQuote,
          receipt: payment.status === "confirmed" ? buildReceipt(payment, existingQuote) : null,
          qr: await getPaymentQr(payment.id),
        };
      }
    }
    throw new Error(insertResult.message);
  }

  const payment = mapPayment(insertResult);
  if (input.method === "cash") {
    // Prepago cash: DO NOT close session — session stays active until valid_until.
    return { payment, quote, receipt: buildReceipt(payment, quote), qr: null };
  }

  const qr = await createPaymentQr(payment, quote);
  return { payment, quote, receipt: null, qr };
}

export async function getPaymentStatus(
  paymentId: string,
  permitHolderId: string,
): Promise<ParkingPaymentStatusDto> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();
  if (error) throw new Error(error.message);
  const row = data as PaymentRow;

  // Ownership check: block cross-tenant reads
  if (row.permit_holder_id !== permitHolderId) {
    throw new Error("Forbidden");
  }

  const payment = mapPayment(row);
  const { tariffs } = await getPermitHolderContext({ permitHolderId });
  const quote = await quoteFromPayment(payment, tariffs);
  const qr = await getPaymentQr(paymentId);
  return {
    payment,
    receipt: payment.status === "confirmed" ? buildReceipt(payment, quote) : null,
    qr,
  };
}

export async function openParkingSession(args: {
  permitHolderId: string;
  input: OpenParkingSessionRequest;
}): Promise<OpenParkingSessionResponse> {
  const input = args.input;
  const licensePlate = normalizeLicensePlate(input.licensePlate);
  const { permitHolder, tariffs } = await getPermitHolderContext({ permitHolderId: args.permitHolderId });
  getTariff(tariffs, input.vehicleKind);
  const supabase = createAdminClient();
  const existingSession = await getActiveSessionForPlate(permitHolder.id, licensePlate);
  if (existingSession) return { session: mapSession(existingSession, tariffs) };

  const { data, error } = await supabase
    .from("parking_sessions")
    .insert({
      zone_id: permitHolder.zone_id,
      permit_holder_id: permitHolder.id,
      license_plate: licensePlate,
      vehicle_kind: input.vehicleKind,
      status: "active",
      kind: input.kind ?? "pospago",
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      const racedSession = await getActiveSessionForPlate(permitHolder.id, licensePlate);
      if (racedSession) return { session: mapSession(racedSession, tariffs) };
    }
    throw new Error(error.message);
  }
  return { session: mapSession(data as SessionRow, tariffs) };
}

export async function openPrepaidSession(args: {
  permitHolderId: string;
  input: OpenPrepaidSessionRequest;
}): Promise<CreateParkingPaymentResponse & { session: ParkingSessionDto }> {
  const input = args.input;
  const licensePlate = normalizeLicensePlate(input.licensePlate);
  const { permitHolder, tariffs } = await getPermitHolderContext({ permitHolderId: args.permitHolderId });
  getTariff(tariffs, input.vehicleKind);
  const supabase = createAdminClient();

  const existingSession = await getActiveSessionForPlate(permitHolder.id, licensePlate);
  let session: SessionRow;
  if (existingSession) {
    session = existingSession;
  } else {
    const { data, error } = await supabase
      .from("parking_sessions")
      .insert({
        zone_id: permitHolder.zone_id,
        permit_holder_id: permitHolder.id,
        license_plate: licensePlate,
        vehicle_kind: input.vehicleKind,
        status: "active",
        kind: "prepago",
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        const racedSession = await getActiveSessionForPlate(permitHolder.id, licensePlate);
        if (racedSession) {
          session = racedSession;
        } else {
          throw new Error(error.message);
        }
      } else {
        throw new Error(error.message);
      }
    } else {
      session = data as SessionRow;
    }
  }

  const paymentResponse = await createPrepaidPayment({
    permitHolderId: args.permitHolderId,
    input: {
      licensePlate: session.license_plate,
      vehicleKind: session.vehicle_kind,
      method: input.method,
      durationMinutes: input.durationMinutes,
      sessionId: session.id,
    },
  });

  return { ...paymentResponse, session: mapSession(session, tariffs) };
}

export async function quoteCloseSession(args: {
  permitHolderId: string;
  sessionId: string;
  method: PaymentMethod;
}): Promise<ParkingQuoteDto> {
  const session = await getActiveSession(args.sessionId);
  return quoteParkingPayment({
    permitHolderId: args.permitHolderId,
    input: {
      vehicleKind: session.vehicle_kind,
      method: args.method,
      sessionId: args.sessionId,
    },
  });
}

export async function closeParkingSession(args: {
  permitHolderId: string;
  sessionId: string;
  method: PaymentMethod;
}): Promise<CloseParkingSessionResponse> {
  const { sessionId, method, permitHolderId } = args;
  const session = await getSessionById(sessionId);

  // Prepago sessions are already settled at creation — do not re-quote by elapsed time.
  if (session.kind === "prepago") {
    throw new Error("Cannot close a prepago session via closeParkingSession; prepago sessions close lazily when valid_until passes");
  }

  const { tariffs } = await getPermitHolderContext({ permitHolderId });

  if (session.status !== "active") {
    const existingPayment = await getExistingClosePayment(sessionId);
    if (!existingPayment) throw new Error("Parking session is already closed");
    const payment = mapPayment(existingPayment);
    const quote = await quoteFromPayment(payment, tariffs);
    return {
      payment,
      quote,
      receipt: payment.status === "confirmed" ? buildReceipt(payment, quote) : null,
      qr: await getPaymentQr(payment.id),
      session: mapSession(session, tariffs),
    };
  }

  // Pospago close: compute elapsed quote and insert payment.
  const tariff = getTariff(tariffs, session.vehicle_kind);
  const elapsedMinutes = await getSessionElapsedMinutes(sessionId);
  const quote = buildQuote(tariff, method, elapsedMinutes);
  const status = method === "cash" ? "confirmed" : "pending";
  const now = new Date().toISOString();

  const insertResult = await insertPayment({
    zone_id: session.zone_id,
    permit_holder_id: session.permit_holder_id,
    parking_session_id: sessionId,
    license_plate: session.license_plate,
    vehicle_kind: session.vehicle_kind,
    method,
    status,
    amount_cents: quote.finalAmountCents,
    base_amount_cents: quote.baseAmountCents,
    discount_cents: quote.discountCents,
    duration_minutes: quote.durationMinutes,
    valid_until: quote.validUntil,
    confirmed_at: status === "confirmed" ? now : null,
  });

  if ("error" in insertResult) {
    if (insertResult.code === "23505") {
      const existingPayment = await getExistingClosePayment(sessionId);
      if (existingPayment) {
        const payment = mapPayment(existingPayment);
        const existingQuote = await quoteFromPayment(payment, tariffs);
        if (payment.status === "confirmed") await closeSession(sessionId);
        return {
          payment,
          quote: existingQuote,
          receipt: payment.status === "confirmed" ? buildReceipt(payment, existingQuote) : null,
          qr: await getPaymentQr(payment.id),
          session: mapSession({ ...session, status: "closed", closed_at: now }, tariffs),
        };
      }
    }
    throw new Error(insertResult.message);
  }

  const payment = mapPayment(insertResult);
  if (method === "cash") {
    await closeSession(sessionId);
    return {
      payment,
      quote,
      receipt: buildReceipt(payment, quote),
      qr: null,
      session: mapSession({ ...session, status: "closed", closed_at: now }, tariffs),
    };
  }

  const qr = await createPaymentQr(payment, quote);
  return {
    payment,
    quote,
    receipt: null,
    qr,
    session: mapSession(session, tariffs),
  };
}

export async function getParkingSession(args: {
  permitHolderId: string;
  id: string;
}): Promise<ParkingSessionDetailDto> {
  const supabase = createAdminClient();
  const { data: sessionData, error: sessionError } = await supabase
    .from("parking_sessions")
    .select("*")
    .eq("id", args.id)
    .single();
  if (sessionError) throw new Error(sessionError.message);

  let session = sessionData as SessionRow;
  const { tariffs } = await getPermitHolderContext({ permitHolderId: args.permitHolderId });

  // For prepago sessions, run lazy-close guard before returning.
  if (session.kind === "prepago" && session.status === "active") {
    const linkedPayment = await getExistingClosePayment(session.id);
    if (linkedPayment?.valid_until && new Date(linkedPayment.valid_until) < new Date()) {
      await closeSession(session.id);
      // Re-fetch after close.
      const { data: refreshed, error: refreshError } = await supabase
        .from("parking_sessions")
        .select("*")
        .eq("id", args.id)
        .single();
      if (refreshError) throw new Error(refreshError.message);
      session = refreshed as SessionRow;
    }
  }

  // Fetch latest linked payment and QR.
  const linkedPayment = await getExistingClosePayment(session.id);
  const qr = linkedPayment ? await getPaymentQr(linkedPayment.id) : null;

  return {
    session: mapSession(session, tariffs, linkedPayment ?? undefined),
    payment: linkedPayment ? mapPayment(linkedPayment) : null,
    qr,
  };
}

export async function closeExpiredPrepaidSessions(activeSessions: SessionRow[]): Promise<SessionRow[]> {
  const prepaidSessions = activeSessions.filter((s) => s.kind === "prepago");
  if (prepaidSessions.length === 0) return activeSessions;

  const supabase = createAdminClient();
  const prepaidIds = prepaidSessions.map((s) => s.id);

  const { data: linkedPayments, error } = await supabase
    .from("payments")
    .select("*")
    .in("parking_session_id", prepaidIds)
    .in("status", ["pending", "confirmed"]);
  if (error) throw new Error(error.message);

  const paymentBySessionId = new Map<string, PaymentRow>();
  for (const p of (linkedPayments ?? []) as PaymentRow[]) {
    if (p.parking_session_id && !paymentBySessionId.has(p.parking_session_id)) {
      paymentBySessionId.set(p.parking_session_id, p);
    }
  }

  const now = new Date();
  const expiredIds = new Set<string>();
  for (const session of prepaidSessions) {
    const payment = paymentBySessionId.get(session.id);
    if (payment?.valid_until && new Date(payment.valid_until) < now) {
      await closeSession(session.id);
      expiredIds.add(session.id);
    }
  }

  return activeSessions.filter((s) => !expiredIds.has(s.id));
}

export async function applyMercadoPagoOrderToPayment(order: MercadoPagoQrOrderResponse) {
  if (!order.external_reference) return null;
  return updatePaymentFromGatewayRef(
    order.external_reference,
    mapMercadoPagoOrderToPaymentStatus(order),
  );
}

async function updatePaymentFromGatewayRef(externalReference: string, nextStatus: PaymentStatus) {
  const supabase = createAdminClient();
  const { data: ref, error: refError } = await supabase
    .from("payment_gateway_refs")
    .select("*")
    .eq("external_reference", externalReference)
    .maybeSingle();
  if (refError) throw new Error(refError.message);
  if (!ref) return null;

  const now = new Date().toISOString();
  const gatewayRef = ref as GatewayRefRow;
  const currentPayment = await getPaymentRow(gatewayRef.payment_id);
  if (!currentPayment) return null;

  if (currentPayment.status === "confirmed" && nextStatus !== "refunded") {
    return mapPayment(currentPayment);
  }

  const update = nextStatus === "confirmed"
    ? { status: nextStatus, confirmed_at: currentPayment.confirmed_at ?? now }
    : { status: nextStatus, confirmed_at: nextStatus === "refunded" ? currentPayment.confirmed_at : null };

  const { data: payment, error } = await supabase
    .from("payments")
    .update(update)
    .eq("id", gatewayRef.payment_id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const row = payment as PaymentRow;
  if (row.status === "confirmed" && row.parking_session_id) {
    // Exact rule from D5: close only if the linked session is pospago.
    const { data: sess, error: sessError } = await supabase
      .from("parking_sessions")
      .select("kind")
      .eq("id", row.parking_session_id)
      .maybeSingle();
    if (sessError) throw new Error(sessError.message);
    if (sess?.kind === "pospago") {
      await closeSession(row.parking_session_id);
    }
    // kind === 'prepago' → do NOT close; session stays active until valid_until (D3 lazy-close)
  }
  return mapPayment(row);
}

// ---------------------------------------------------------------------------
// insertPayment — shared helper used by createPrepaidPayment and
// closeParkingSession. Returns the inserted PaymentRow on success, or an
// object with { error: true, code, message } on failure.
// ---------------------------------------------------------------------------
type InsertPaymentInput = {
  zone_id: string;
  permit_holder_id: string;
  parking_session_id: string | null;
  license_plate: string;
  vehicle_kind: VehicleKind;
  method: PaymentMethod;
  status: PaymentStatus;
  amount_cents: number;
  base_amount_cents: number;
  discount_cents: number;
  duration_minutes: number;
  valid_until: string | null;
  confirmed_at: string | null;
};

type InsertPaymentError = { error: true; code: string; message: string };

async function insertPayment(input: InsertPaymentInput): Promise<PaymentRow | InsertPaymentError> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .insert(input)
    .select("*")
    .single();
  if (error) {
    return { error: true, code: error.code, message: error.message };
  }
  return data as PaymentRow;
}

async function createPaymentQr(payment: PaymentDto, quote: ParkingQuoteDto): Promise<ParkingQrDto> {
  const externalId = `sem_${payment.id.replaceAll("-", "")}`.slice(0, 64);
  const qr = await createMercadoPagoQrOrder({
    amount: (quote.finalAmountCents / 100).toFixed(2),
    description: `SEM ${payment.licensePlate}`,
    externalId,
  });
  const supabase = createAdminClient();
  const { error } = await supabase.from("payment_gateway_refs").insert({
    payment_id: payment.id,
    provider: "mercadopago",
    provider_order_id: qr.orderId,
    provider_payment_id: qr.paymentId ?? null,
    external_reference: externalId,
    qr_data: qr.qrData,
    qr_image_data_url: qr.qrImageDataUrl,
    raw_provider_payload: qr.raw,
  });
  if (error) throw new Error(error.message);
  return { qrData: qr.qrData, qrImageDataUrl: qr.qrImageDataUrl, providerOrderId: qr.orderId };
}

async function getPermitHolderContext(args: {
  permitHolderId: string;
}): Promise<PermitHolderContext> {
  const supabase = createAdminClient();
  const { data: permitHolder, error: holderError } = await supabase
    .from("permit_holders")
    .select("id, display_name, file_number, zone_id, zones(id, name)")
    .eq("id", args.permitHolderId)
    .single();
  if (holderError) throw new Error(holderError.message);

  const holder = permitHolder as unknown as PermitHolderContext["permitHolder"];
  const { data: tariffs, error: tariffsError } = await supabase
    .from("tariffs")
    .select("*")
    .eq("zone_id", holder.zone_id)
    .eq("active", true)
    .order("vehicle_kind", { ascending: true });
  if (tariffsError) throw new Error(tariffsError.message);
  return { permitHolder: holder, tariffs: (tariffs ?? []) as TariffRow[] };
}

function getTariff(tariffs: TariffRow[], vehicleKind: VehicleKind) {
  const tariff = tariffs.find((item) => item.vehicle_kind === vehicleKind);
  if (!tariff) throw new Error(`No active tariff for ${vehicleKind}`);
  return tariff;
}

function buildQuote(tariff: TariffRow, method: PaymentMethod, durationMinutes: number): ParkingQuoteDto {
  const billedMinutes = Math.max(60, Math.ceil(durationMinutes / 60) * 60);
  const baseAmountCents = Math.round((tariff.hourly_rate_cents * billedMinutes) / 60);
  const discountCents = method === "digital"
    ? Math.round(baseAmountCents * (tariff.digital_discount_percent / 100))
    : 0;
  return {
    vehicleKind: tariff.vehicle_kind,
    vehicleLabel: tariff.label,
    method,
    durationMinutes,
    billedMinutes,
    hourlyRateCents: tariff.hourly_rate_cents,
    baseAmountCents,
    discountCents,
    finalAmountCents: baseAmountCents - discountCents,
    digitalDiscountPercent: tariff.digital_discount_percent,
    validUntil: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
  };
}

async function getSessionElapsedMinutes(sessionId: string) {
  const session = await getActiveSession(sessionId);
  return Math.max(1, Math.ceil((Date.now() - new Date(session.started_at).getTime()) / 60000));
}

async function getActiveSession(sessionId: string): Promise<SessionRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parking_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("status", "active")
    .single();
  if (error) throw new Error(error.message);
  return data as SessionRow;
}

async function getSessionById(sessionId: string): Promise<SessionRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parking_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (error) throw new Error(error.message);
  return data as SessionRow;
}

async function getActiveSessionForPlate(permitHolderId: string, licensePlate: string): Promise<SessionRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parking_sessions")
    .select("*")
    .eq("permit_holder_id", permitHolderId)
    .eq("license_plate", licensePlate)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as SessionRow | null;
}

async function getExistingClosePayment(sessionId: string): Promise<PaymentRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("parking_session_id", sessionId)
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as PaymentRow | null;
}

async function getPaymentRow(paymentId: string): Promise<PaymentRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as PaymentRow | null;
}

async function closeSession(sessionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("parking_sessions")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("status", "active");
  if (error) throw new Error(error.message);
}

async function quoteFromPayment(payment: PaymentDto, tariffs: TariffRow[]) {
  const tariff = getTariff(tariffs, payment.vehicleKind);
  const billedMinutes = Math.max(60, Math.ceil(payment.durationMinutes / 60) * 60);
  return {
    vehicleKind: payment.vehicleKind,
    vehicleLabel: tariff.label,
    method: payment.method,
    durationMinutes: payment.durationMinutes,
    billedMinutes,
    hourlyRateCents: Math.round((payment.baseAmountCents * 60) / billedMinutes),
    baseAmountCents: payment.baseAmountCents,
    discountCents: payment.discountCents,
    finalAmountCents: payment.amountCents,
    digitalDiscountPercent: payment.baseAmountCents > 0
      ? Math.round((payment.discountCents / payment.baseAmountCents) * 100)
      : 0,
    validUntil: payment.validUntil,
  } satisfies ParkingQuoteDto;
}

function mapMercadoPagoOrderToPaymentStatus(order: MercadoPagoQrOrderResponse): PaymentStatus {
  const payment = order.transactions?.payments?.[0];
  const hasRefund = (order.transactions?.refunds?.length ?? 0) > 0;

  if (
    hasRefund ||
    order.status === "refunded" ||
    order.status_detail === "refunded" ||
    order.status_detail === "partially_refunded" ||
    Number(payment?.refunded_amount ?? 0) > 0
  ) {
    return "refunded";
  }

  if (
    (order.status === "processed" || order.status === "paid") &&
    order.status_detail === "accredited"
  ) {
    return "confirmed";
  }

  if (payment?.status === "approved" && payment.status_detail === "accredited") {
    return "confirmed";
  }

  if (order.status === "expired") return "expired";
  if (order.status === "canceled" || order.status === "cancelled") return "cancelled";
  if (order.status === "failed" || payment?.status === "rejected") return "failed";

  return "pending";
}

async function getPaymentQr(paymentId: string): Promise<ParkingQrDto | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_gateway_refs")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const ref = data as GatewayRefRow;
  if (!ref.qr_data || !ref.qr_image_data_url || !ref.provider_order_id) return null;
  return {
    qrData: ref.qr_data,
    qrImageDataUrl: ref.qr_image_data_url,
    providerOrderId: ref.provider_order_id,
  };
}

function mapTariff(row: TariffRow): VehicleTariffDto {
  return {
    vehicleKind: row.vehicle_kind,
    label: row.label,
    hourlyRateCents: row.hourly_rate_cents,
    digitalDiscountPercent: row.digital_discount_percent,
  };
}

function mapSession(row: SessionRow, tariffs: TariffRow[], linkedPayment?: PaymentRow): ParkingSessionDto {
  const tariff = getTariff(tariffs, row.vehicle_kind);
  const end = row.closed_at ? new Date(row.closed_at).getTime() : Date.now();
  return {
    id: row.id,
    licensePlate: row.license_plate,
    vehicleKind: row.vehicle_kind,
    vehicleLabel: tariff.label,
    startedAt: row.started_at,
    elapsedMinutes: Math.max(1, Math.ceil((end - new Date(row.started_at).getTime()) / 60000)),
    status: row.status,
    kind: row.kind,
    validUntil: linkedPayment?.valid_until ?? null,
    paymentId: linkedPayment?.id ?? null,
    paymentStatus: linkedPayment?.status ?? null,
  };
}

function mapPayment(row: PaymentRow): PaymentDto {
  return {
    id: row.id,
    licensePlate: row.license_plate,
    vehicleKind: row.vehicle_kind,
    method: row.method,
    status: row.status,
    amountCents: row.amount_cents,
    baseAmountCents: row.base_amount_cents,
    discountCents: row.discount_cents,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    validUntil: row.valid_until,
    sessionId: row.parking_session_id,
  };
}

function buildReceipt(payment: PaymentDto, quote: ParkingQuoteDto): ParkingReceiptDto {
  return { payment, quote, code: `SEM-${payment.id.slice(0, 8).toUpperCase()}` };
}
