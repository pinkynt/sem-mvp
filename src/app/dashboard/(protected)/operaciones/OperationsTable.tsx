"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { OperationFilters, OperationRowDto, ZoneDto } from "@/contracts/dashboard";
import { DashboardBadge } from "@/components/dashboard/DashboardBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { formatCurrency, formatDateTime } from "@/components/dashboard/format";

const columns: ColumnDef<OperationRowDto>[] = [
  { accessorKey: "licensePlate", header: "Patente", cell: ({ row }) => <strong>{row.original.licensePlate}</strong> },
  { accessorKey: "zoneName", header: "Zona" },
  { accessorKey: "permitHolderName", header: "Permisionario" },
  { accessorKey: "method", header: "Medio", cell: ({ row }) => <DashboardBadge tone={row.original.method === "digital" ? "digital" : "neutral"}>{row.original.method === "digital" ? "Mercado Pago" : "Efectivo"}</DashboardBadge> },
  { accessorKey: "status", header: "Estado", cell: ({ row }) => <DashboardBadge tone={row.original.status === "confirmed" ? "confirmed" : row.original.status === "pending" ? "pending" : "failed"}>{row.original.status}</DashboardBadge> },
  { accessorKey: "amountCents", header: "Monto", cell: ({ row }) => formatCurrency(row.original.amountCents) },
  { accessorKey: "createdAt", header: "Fecha", cell: ({ row }) => formatDateTime(row.original.createdAt) },
  { id: "actions", header: "", cell: ({ row }) => <Link className="font-bold text-brand hover:text-brand-strong" href={`/dashboard/operaciones/${row.original.id}`}>Ver detalle</Link> },
];

export function OperationsTable({ rows, zones, filters }: { rows: OperationRowDto[]; zones: ZoneDto[]; filters: OperationFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`);
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-3 rounded-card border border-border bg-surface p-4 shadow-sm md:grid-cols-5" aria-label="Filtros de operaciones">
        <FilterField label="Desde" name="from" type="date" value={filters.from?.slice(0, 10) ?? ""} onChange={setParam} />
        <FilterField label="Hasta" name="to" type="date" value={filters.to?.slice(0, 10) ?? ""} onChange={setParam} />
        <label className="text-sm font-bold text-ink">Estado<select name="status" value={filters.status ?? "all"} onChange={(event) => setParam("status", event.target.value === "all" ? "" : event.target.value)} className="mt-2 min-h-11 w-full rounded-input border border-border px-3"><option value="all">Todos</option><option value="confirmed">Confirmado</option><option value="pending">Pendiente</option><option value="failed">Fallido</option><option value="expired">Expirado</option><option value="cancelled">Cancelado</option><option value="refunded">Reintegrado</option></select></label>
        <label className="text-sm font-bold text-ink">Medio<select name="method" value={filters.method ?? "all"} onChange={(event) => setParam("method", event.target.value === "all" ? "" : event.target.value)} className="mt-2 min-h-11 w-full rounded-input border border-border px-3"><option value="all">Todos</option><option value="cash">Efectivo</option><option value="digital">Mercado Pago</option></select></label>
        <label className="text-sm font-bold text-ink">Zona<select name="zoneId" value={filters.zoneId ?? ""} onChange={(event) => setParam("zoneId", event.target.value)} className="mt-2 min-h-11 w-full rounded-input border border-border px-3"><option value="">Todas</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
      </form>
      <DataTable columns={columns} data={rows} searchPlaceholder="Filtrar por patente" globalFilterValue={filters.plate ?? ""} onGlobalFilterValueChange={(value) => setParam("plate", value.trim())} />
    </div>
  );
}

function FilterField({ label, name, type, value, onChange }: { label: string; name: string; type: string; value: string; onChange: (name: string, value: string) => void }) {
  return <label className="text-sm font-bold text-ink">{label}<input name={name} type={type} value={value} onChange={(event) => onChange(name, event.target.value)} className="mt-2 min-h-11 w-full rounded-input border border-border px-3 outline-none focus-visible:ring-4 focus-visible:ring-brand/20" /></label>;
}
