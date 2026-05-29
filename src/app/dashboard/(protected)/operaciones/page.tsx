import Link from "next/link";
import { OperationsTable } from "@/app/dashboard/(protected)/operaciones/OperationsTable";
import type { OperationFilters, PaymentMethod, PaymentStatus } from "@/contracts/dashboard";
import { getOperationDateRangeError, type OperationDateRangeError } from "@/lib/operation-date-filters";
import { getOperations, getZones } from "@/server/dashboard/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OperationsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = await searchParams;
  const filters = parseOperationFilters(params ?? {});
  const dateError = getOperationDateRangeError(filters.from, filters.to);
  const queryFilters = dateError ? { ...filters, from: undefined, to: undefined } : filters;
  const [operations, zones] = await Promise.all([getOperations({ ...queryFilters, pageSize: 100 }), getZones()]);
  const exportHref = `/api/dashboard/exports/operations.csv${toQueryString(queryFilters)}`;
  return <div className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-3xl font-extrabold text-brand-strong">Operaciones</h2><p className="mt-2 text-ink-soft">Pagos y sesiones con filtros de tabla y detalle trazable.</p></div><Link href={exportHref} className="rounded-pill bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-hover">Exportar CSV filtrado</Link></div><OperationsTable rows={operations.rows} zones={zones} filters={filters} dateError={dateError ? getDateErrorMessage(dateError) : undefined} /></div>;
}

function parseOperationFilters(params: Record<string, string | string[] | undefined>): OperationFilters {
  const status = first(params.status) as PaymentStatus | "all" | undefined;
  const method = first(params.method) as PaymentMethod | "all" | undefined;
  const filters: OperationFilters = {};
  if (status) filters.status = status;
  if (method) filters.method = method;
  filters.from = first(params.from) || undefined;
  filters.to = first(params.to) || undefined;
  filters.plate = first(params.plate) || undefined;
  filters.zoneId = first(params.zoneId) || undefined;
  filters.permitHolderId = first(params.permitHolderId) || undefined;
  return filters;
}

function toQueryString(filters: OperationFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value && value !== "all") params.set(key, String(value));
  const query = params.toString();
  return query ? `?${query}` : "";
}

function getDateErrorMessage(error: OperationDateRangeError) {
  if (error === "range") return "La fecha \"Hasta\" no puede ser anterior a \"Desde\".";
  return "Fecha inválida.";
}

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
