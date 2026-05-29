import { PermitHoldersTable } from "@/app/dashboard/(protected)/permisionarios/PermitHoldersTable";
import { QuickCreatePermitHolderForm } from "@/app/dashboard/(protected)/permisionarios/QuickCreatePermitHolderForm";
import { getPermitHolders, getZones } from "@/server/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function PermitHoldersPage() {
  const [holders, zones] = await Promise.all([getPermitHolders(), getZones()]);
  return <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]"><section className="rounded-card border border-border bg-surface p-6"><h2 className="text-2xl font-extrabold text-brand-strong">Alta rápida</h2><QuickCreatePermitHolderForm zones={zones} /></section><section className="space-y-4"><div><h2 className="text-3xl font-extrabold text-brand-strong">Permisionarios</h2><p className="mt-2 text-ink-soft">Padrón operativo, edición y cuenta preparada para una fase futura.</p></div><PermitHoldersTable rows={holders} zones={zones} /></section></div>;
}
