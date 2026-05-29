import type { PaymentStatus } from "@/contracts/dashboard";

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(cents / 100);
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function formatPercent(value: number) {
  return `${value}%`;
}

export function formatPaymentStatus(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    expired: "Expirado",
    cancelled: "Cancelado",
    failed: "Fallido",
    refunded: "Reintegrado",
  };
  return labels[status];
}

export function formatSessionStatus(status: "active" | "closed" | "open" | "pending" | "cancelled") {
  const labels = {
    active: "Abierta",
    open: "Abierta",
    closed: "Cerrada",
    pending: "Pendiente",
    cancelled: "Cancelada",
  };
  return labels[status];
}
