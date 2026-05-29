import { getOperation } from "@/server/dashboard/queries";
import { DashboardBadge } from "@/components/dashboard/DashboardBadge";
import { formatCurrency, formatDateTime, formatPaymentStatus, formatSessionStatus } from "@/components/dashboard/format";
import { requireDashboardUser } from "@/server/dashboard/auth";

export const dynamic = "force-dynamic";

export default async function OperationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [operation, user] = await Promise.all([getOperation(id), requireDashboardUser()]);
  return <div className="space-y-6"><div><p className="text-sm font-bold uppercase tracking-[0.22em] text-brand">Operación</p><h2 className="text-3xl font-extrabold text-brand-strong">{operation.licensePlate}</h2></div><section className="grid gap-4 md:grid-cols-2"><Info label="Estado" value={<DashboardBadge tone={operation.status === "confirmed" ? "confirmed" : "pending"}>{formatPaymentStatus(operation.status)}</DashboardBadge>} /><Info label="Monto" value={formatCurrency(operation.amountCents)} /><Info label="Permisionario" value={`${operation.permitHolderName} · ${operation.permitHolderFileNumber}`} /><Info label="Zona" value={operation.zoneName} /><Info label="Medio" value={operation.method === "digital" ? "Mercado Pago" : "Efectivo"} /><Info label="Creado" value={formatDateTime(operation.createdAt)} /><Info label="Sesión" value={operation.session ? `${formatSessionStatus(operation.session.status)} · ${formatDateTime(operation.session.startedAt)}` : "No asociada"} />{user.role === "admin" ? <Info label="Referencia de pago" value={operation.gateway ? <span className="break-all font-mono text-sm font-semibold text-ink-soft">{operation.gateway.externalReference}</span> : "Sin referencia"} /> : null}</section></div>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) { return <article className="rounded-card border border-border bg-surface p-5"><p className="text-sm font-bold text-ink-soft">{label}</p><div className="mt-2 text-lg font-extrabold text-ink">{value}</div></article>; }
