import { Sparkles } from "lucide-react";
import type { DashboardAiInsightsDto } from "@/contracts/dashboard";

export function AiDailyInsightsCard({ insights }: { insights: DashboardAiInsightsDto }) {
  return (
    <article className="rounded-card border border-brand-soft/40 bg-brand-tint/60 p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-pill bg-brand p-2 text-surface" aria-hidden>
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">IA municipal</p>
            <h2 className="mt-1 text-xl font-extrabold text-brand-strong">{insights.title}</h2>
          </div>
        </div>
        <p className="max-w-xl text-sm font-semibold leading-6 text-ink-soft">
          Interpretación automática de las métricas operativas disponibles para la jornada.
        </p>
      </div>
      <ul className="mt-5 grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
        {insights.insights.map((insight) => (
          <li key={insight} className="rounded-input bg-surface/85 px-4 py-3 text-sm font-bold leading-6 text-ink shadow-sm">
            {insight}
          </li>
        ))}
      </ul>
    </article>
  );
}
