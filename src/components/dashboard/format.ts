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
