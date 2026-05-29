import type {
  CloseParkingSessionRequest,
  CloseParkingSessionResponse,
  CreateParkingPaymentRequest,
  CreateParkingPaymentResponse,
  OpenParkingSessionRequest,
  OpenParkingSessionResponse,
  ParkingDashboardDto,
  ParkingPaymentStatusDto,
  ParkingQuoteDto,
  ParkingQuoteRequest,
  PaymentMethod,
} from "@/contracts/parking";

export function getPermitHolderHome() {
  return parkingFetch<ParkingDashboardDto>("/api/parking/permit-holder/home");
}

export function quoteParkingPayment(body: ParkingQuoteRequest) {
  return parkingFetch<ParkingQuoteDto>("/api/parking/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createParkingPayment(body: CreateParkingPaymentRequest) {
  return parkingFetch<CreateParkingPaymentResponse>("/api/parking/payments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getParkingPaymentStatus(paymentId: string) {
  return parkingFetch<ParkingPaymentStatusDto>(`/api/parking/payments/${paymentId}`);
}

export function openParkingSession(body: OpenParkingSessionRequest) {
  return parkingFetch<OpenParkingSessionResponse>("/api/parking/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function quoteCloseParkingSession(sessionId: string, method: PaymentMethod) {
  return parkingFetch<ParkingQuoteDto>(`/api/parking/sessions/${sessionId}/quote-close`, {
    method: "POST",
    body: JSON.stringify({ method }),
  });
}

export function closeParkingSession(sessionId: string, body: CloseParkingSessionRequest) {
  return parkingFetch<CloseParkingSessionResponse>(`/api/parking/sessions/${sessionId}/close`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function parkingFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const demoApiKey = process.env.NEXT_PUBLIC_SEM_DEMO_API_KEY;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(demoApiKey ? { "x-sem-demo-key": demoApiKey } : {}),
      ...init?.headers,
    },
  });

  const data = (await response.json()) as T | { error?: string };
  if (!response.ok) {
    const message = isErrorResponse(data) ? data.error : "Parking API request failed";
    throw new Error(message);
  }
  return data as T;
}

function isErrorResponse(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}
