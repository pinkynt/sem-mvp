import type { PaymentMethod, PaymentDto } from "@/contracts/parking";
import type { Status } from "@/components";
import { formatPlateGrouped } from "@/lib/plate";

export function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

export function timeLabel(value: string): string {
  return new Date(value).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function elapsedLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function displayPlate(plate: string): string {
  return formatPlateGrouped(plate);
}

export function statusFromPayment(method: PaymentMethod, status: PaymentDto["status"]): Status {
  if (status === "pending") return "pendiente";
  return method === "cash" ? "efectivo" : "digital";
}
