export type VehicleKind = "auto" | "moto";
export type PaymentMethod = "cash" | "digital";
export type PaymentStatus = "pending" | "confirmed" | "expired" | "cancelled" | "failed" | "refunded";
export type SessionStatus = "active" | "closed";

export type VehicleTariffDto = {
  vehicleKind: VehicleKind;
  label: string;
  hourlyRateCents: number;
  digitalDiscountPercent: number;
};

export type PermitHolderDto = {
  id: string;
  displayName: string;
  fileNumber: string;
  zone: { id: string; name: string };
};

export type ParkingSessionDto = {
  id: string;
  licensePlate: string;
  vehicleKind: VehicleKind;
  vehicleLabel: string;
  startedAt: string;
  elapsedMinutes: number;
  status: SessionStatus;
};

export type PaymentDto = {
  id: string;
  licensePlate: string;
  vehicleKind: VehicleKind;
  method: PaymentMethod;
  status: PaymentStatus;
  amountCents: number;
  baseAmountCents: number;
  discountCents: number;
  durationMinutes: number;
  createdAt: string;
  confirmedAt: string | null;
  validUntil: string | null;
  sessionId: string | null;
};

export type ParkingDashboardDto = {
  permitHolder: PermitHolderDto;
  tariffs: VehicleTariffDto[];
  totals: {
    todayAmountCents: number;
    todayCount: number;
    accumulatedAmountCents: number;
  };
  activeSessions: ParkingSessionDto[];
  recentPayments: PaymentDto[];
};

export type ParkingQuoteRequest = {
  vehicleKind: VehicleKind;
  method: PaymentMethod;
  durationMinutes?: number;
  sessionId?: string;
};

export type ParkingQuoteDto = {
  vehicleKind: VehicleKind;
  vehicleLabel: string;
  method: PaymentMethod;
  durationMinutes: number;
  billedMinutes: number;
  hourlyRateCents: number;
  baseAmountCents: number;
  discountCents: number;
  finalAmountCents: number;
  digitalDiscountPercent: number;
  validUntil: string | null;
};

export type ParkingReceiptDto = {
  payment: PaymentDto;
  quote: ParkingQuoteDto;
  code: string;
};

export type ParkingQrDto = {
  qrData: string;
  qrImageDataUrl: string;
  providerOrderId: string;
};

export type CreateParkingPaymentRequest = {
  licensePlate: string;
  vehicleKind: VehicleKind;
  method: PaymentMethod;
  durationMinutes?: number;
  sessionId?: string;
};

export type CreateParkingPaymentResponse = {
  payment: PaymentDto;
  quote: ParkingQuoteDto;
  receipt: ParkingReceiptDto | null;
  qr: ParkingQrDto | null;
};

export type ParkingPaymentStatusDto = {
  payment: PaymentDto;
  receipt: ParkingReceiptDto | null;
  qr: ParkingQrDto | null;
};

export type OpenParkingSessionRequest = {
  licensePlate: string;
  vehicleKind: VehicleKind;
};

export type OpenParkingSessionResponse = {
  session: ParkingSessionDto;
};

export type CloseParkingSessionRequest = {
  method: PaymentMethod;
};

export type CloseParkingSessionResponse = CreateParkingPaymentResponse & {
  session: ParkingSessionDto;
};
