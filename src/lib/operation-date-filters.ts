export const MIN_OPERATION_FILTER_DATE = "2020-01-01";
export const MAX_OPERATION_FILTER_DATE = "2100-12-31";

export type OperationDateRangeError = "invalid" | "range";

export function getOperationDateRangeError(from?: string, to?: string): OperationDateRangeError | null {
  const parsedFrom = parseDateOnly(from);
  const parsedTo = parseDateOnly(to);

  if (parsedFrom === false || parsedTo === false) return "invalid";
  if (parsedFrom && parsedTo && parsedTo.date.getTime() < parsedFrom.date.getTime()) return "range";

  return null;
}

export function normalizeOperationDateFilter(value: string | undefined, boundary: "start" | "end") {
  const parsed = parseDateOnly(value);
  if (!parsed) return null;

  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  if (boundary === "start") date.setHours(0, 0, 0, 0);
  else date.setHours(23, 59, 59, 999);

  return date.toISOString();
}

function parseDateOnly(value: string | undefined): { date: Date; year: number; month: number; day: number } | false | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
  if (value < MIN_OPERATION_FILTER_DATE || value > MAX_OPERATION_FILTER_DATE) return false;

  return { date, year, month, day };
}
