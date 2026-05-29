import { getOperation } from "@/server/dashboard/queries";
import { DashboardBadge } from "@/components/dashboard/DashboardBadge";
import { formatCurrency, formatDateTime } from "@/components/dashboard/format";

export const dynamic = "force-dynamic";

export default async function OperationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operation = await getOperation(id);
  return <div className="space-y-6"><div><p className="text-sm font-bold uppercase tracking-[0.22em] text-brand">Operación</p><h2 className="text-3xl font-extrabold text-brand-strong">{operation.licensePlate}</h2></div><section className="grid gap-4 md:grid-cols-2"><Info label="Estado" value={<DashboardBadge tone={operation.status === "confirmed" ? "confirmed" : "pending"}>{operation.status}</DashboardBadge>} /><Info label="Monto" value={formatCurrency(operation.amountCents)} /><Info label="Permisionario" value={`${operation.permitHolderName} · ${operation.permitHolderFileNumber}`} /><Info label="Zona" value={operation.zoneName} /><Info label="Medio" value={operation.method === "digital" ? "Mercado Pago" : "Efectivo"} /><Info label="Creado" value={formatDateTime(operation.createdAt)} /><Info label="Sesión" value={operation.session ? `${operation.session.status} · ${formatDateTime(operation.session.startedAt)}` : "No asociada"} /><Info label="Gateway" value={operation.gateway ? operation.gateway.externalReference : "Sin referencia"} /></section></div>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) { return <article className="rounded-card border border-border bg-surface p-5"><p className="text-sm font-bold text-ink-soft">{label}</p><div className="mt-2 text-lg font-extrabold text-ink">{value}</div></article>; }
