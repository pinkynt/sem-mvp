import { DashboardBadge } from "@/components/dashboard/DashboardBadge";
import { formatCurrency } from "@/components/dashboard/format";
import { getTariffs, getZones } from "@/server/dashboard/queries";
import { TariffCreateForm } from "@/app/dashboard/(protected)/tarifas/TariffCreateForm";

export const dynamic = "force-dynamic";

export default async function TariffsPage() {
  const [tariffs, zones] = await Promise.all([getTariffs(), getZones()]);
  return <div className="grid gap-6 lg:grid-cols-[0.85fr_1.25fr]"><section className="rounded-card border border-border bg-surface p-6"><h2 className="text-2xl font-extrabold text-brand-strong">Nueva tarifa activa</h2><TariffCreateForm zones={zones} /></section><section><h2 className="text-3xl font-extrabold text-brand-strong">Tarifas</h2><div className="mt-5 space-y-3">{tariffs.map((tariff) => <article key={tariff.id} className="rounded-card border border-border bg-surface p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-extrabold text-ink">{tariff.zoneName} · {tariff.label}</h3><p className="text-sm text-ink-soft">{tariff.vehicleKind} · {formatCurrency(tariff.hourlyRateCents)} por hora · {tariff.digitalDiscountPercent}% digital</p></div><DashboardBadge tone={tariff.active ? "confirmed" : "neutral"}>{tariff.active ? "Activa" : "Histórica"}</DashboardBadge></div></article>)}</div></section></div>;
}
