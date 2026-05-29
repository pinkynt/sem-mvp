import type { VehicleKind } from "@/contracts/parking";

const AUTO_MERCOSUR = /^[A-Z]{2}\d{3}[A-Z]{2}$/;
const AUTO_LEGACY = /^[A-Z]{3}\d{3}$/;
const MOTO_MERCOSUR = /^[A-Z]\d{3}[A-Z]{3}$/;

export function normalizePlate(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function plateMaxLength(_kind?: VehicleKind | null): number {
  return 7;
}

export function isValidPlate(plate: string, kind?: VehicleKind | null): boolean {
  if (!plate) return false;
  if (kind === "moto") return MOTO_MERCOSUR.test(plate);
  if (kind === "auto") return AUTO_MERCOSUR.test(plate) || AUTO_LEGACY.test(plate);
  return AUTO_MERCOSUR.test(plate) || AUTO_LEGACY.test(plate) || MOTO_MERCOSUR.test(plate);
}

export function plateExample(kind?: VehicleKind | null): string {
  if (kind === "moto") return "A123BCD";
  return "AB123CD";
}

export function plateExampleHint(kind?: VehicleKind | null): string {
  if (kind === "moto") return "A 123 BCD";
  if (kind === "auto") return "AB 123 CD o ABC 123";
  return "AB 123 CD";
}

export function formatPlateGrouped(plate: string): string {
  if (AUTO_MERCOSUR.test(plate)) return `${plate.slice(0, 2)} ${plate.slice(2, 5)} ${plate.slice(5)}`;
  if (MOTO_MERCOSUR.test(plate)) return `${plate.slice(0, 1)} ${plate.slice(1, 4)} ${plate.slice(4)}`;
  if (AUTO_LEGACY.test(plate)) return `${plate.slice(0, 3)} ${plate.slice(3)}`;
  return plate;
}
