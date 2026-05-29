import { Activity, Banknote, Clock, Smartphone, Users } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { LatestMovements } from "@/components/dashboard/LatestMovements";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { AiDailyInsightsCard } from "@/components/dashboard/AiDailyInsightsCard";
import { DashboardAiChat } from "@/components/dashboard/DashboardAiChat";
import { formatCurrency, formatPercent } from "@/components/dashboard/format";
import { getDashboardKpis, getLatestMovements, getRevenueChart } from "@/server/dashboard/queries";
import { getDashboardAiInsights } from "@/server/dashboard/ai-insights";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const [kpis, chart, movements, aiInsights] = await Promise.all([getDashboardKpis(), getRevenueChart(), getLatestMovements(), getDashboardAiInsights()]);
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard tone="brand" label="Recaudación hoy" value={formatCurrency(kpis.todayRevenueCents)} hint={`${kpis.todayPayments} pagos confirmados`} icon={<Banknote className="size-6" />} />
        <MetricCard label="Sesiones activas" value={String(kpis.activeSessions)} hint="Estacionamientos en curso" icon={<Activity className="size-6" />} />
        <MetricCard label="Permisionarios" value={String(kpis.permitHolders)} hint="Activos en padrón" icon={<Users className="size-6" />} />
        <MetricCard label="Pendientes" value={String(kpis.pendingPayments)} hint="Pagos por confirmar" icon={<Clock className="size-6" />} />
        <MetricCard label="Pagos digitales" value={formatPercent(kpis.digitalSharePercent)} hint="Sobre cobros confirmados" icon={<Smartphone className="size-6" />} />
      </section>
      <AiDailyInsightsCard insights={aiInsights} />
      <DashboardAiChat />
      <section className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
        <article className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-brand-strong">Recaudación últimos 7 días</h2>
          <RevenueChart data={chart} />
        </article>
        <article className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-brand-strong">Últimos movimientos</h2>
          <div className="mt-4"><LatestMovements initialMovements={movements} /></div>
        </article>
      </section>
    </div>
  );
}
