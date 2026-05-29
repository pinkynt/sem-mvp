"use client";

import type { ZoneAdminDto } from "@/contracts/dashboard";
import { DashboardBadge } from "@/components/dashboard/DashboardBadge";

type ApiError = { error?: string; field?: string };

export function ZonesManager({ initialZones }: { initialZones: ZoneAdminDto[] }) {
  const activeCount = initialZones.filter((zone) => zone.active).length;
  const permitHolderCount = initialZones.reduce((total, zone) => total + zone.permitHolderCount, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">Zonas SEM</p>
            <h2 className="mt-1 text-3xl font-extrabold text-brand-strong">Administración de zonas</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">Creá, editá o desactivá zonas sin perder el historial de permisionarios, sesiones ni pagos.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-80">
            <Metric label="Zonas activas" value={String(activeCount)} />
            <Metric label="Permisionarios" value={String(permitHolderCount)} />
          </div>
        </div>
        <ZoneCreateForm />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {initialZones.map((zone) => <ZoneCard key={zone.id} zone={zone} />)}
      </section>
    </div>
  );
}

function ZoneCreateForm() {
  async function submit(formData: FormData) {
    const response = await fetch("/api/dashboard/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: String(formData.get("name") ?? ""), active: true }),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "No se pudo crear la zona.");
    window.location.reload();
  }

  return (
    <form action={submit} className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
      <label className="block text-sm font-bold text-ink">Nueva zona<input name="name" required minLength={2} placeholder="Ej: Centro B" className="mt-2 min-h-12 w-full rounded-input border border-border px-4 outline-none focus-visible:ring-4 focus-visible:ring-brand/20" /></label>
      <button type="submit" className="self-end rounded-pill bg-brand px-5 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20">Crear zona</button>
    </form>
  );
}

function ZoneCard({ zone }: { zone: ZoneAdminDto }) {
  return (
    <article className="rounded-card border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold text-ink">{zone.name}</h3>
            <DashboardBadge tone={zone.active ? "confirmed" : "neutral"}>{zone.active ? "Activa" : "Borrada"}</DashboardBadge>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{zone.activePermitHolderCount} activos · {zone.permitHolderCount} permisionarios asignados</p>
        </div>
        <ZoneEditForm zone={zone} />
      </div>

      <details className="mt-5 rounded-input bg-surface-muted p-4">
        <summary className="cursor-pointer text-sm font-extrabold text-brand">Ver permisionarios asignados</summary>
        {zone.permitHolders.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-ink-soft"><tr><th className="py-2 pr-4">Nombre</th><th className="py-2 pr-4">Legajo</th><th className="py-2 pr-4">Estado</th><th className="py-2 pr-4">Cuenta</th></tr></thead>
              <tbody>
                {zone.permitHolders.map((holder) => (
                  <tr key={holder.id} className="border-t border-border">
                    <td className="py-3 pr-4 font-bold text-ink">{holder.displayName}</td>
                    <td className="py-3 pr-4 text-ink-soft">{holder.fileNumber}</td>
                    <td className="py-3 pr-4"><DashboardBadge tone={holder.active ? "confirmed" : "failed"}>{holder.active ? "Activo" : "Inactivo"}</DashboardBadge></td>
                    <td className="py-3 pr-4 text-ink-soft">{holder.account?.username ?? "Sin cuenta"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-3 text-sm text-ink-soft">Todavía no hay permisionarios asignados a esta zona.</p>}
      </details>
    </article>
  );
}

function ZoneEditForm({ zone }: { zone: ZoneAdminDto }) {
  async function save(formData: FormData) {
    const response = await fetch(`/api/dashboard/zones/${zone.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: String(formData.get("name") ?? ""), active: String(formData.get("active") ?? "true") === "true" }),
    });
    if (!response.ok) throw new Error(((await response.json().catch(() => null)) as ApiError | null)?.error ?? "No se pudo guardar la zona.");
    window.location.reload();
  }

  async function remove() {
    if (!window.confirm("La zona se marcará como borrada y no aparecerá para nuevas asignaciones. El historial se conserva.")) return;
    const response = await fetch(`/api/dashboard/zones/${zone.id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(((await response.json().catch(() => null)) as ApiError | null)?.error ?? "No se pudo borrar la zona.");
    window.location.reload();
  }

  return (
    <div className="grid gap-3 sm:min-w-72">
      <form action={save} className="grid gap-3">
        <label className="block text-sm font-bold text-ink">Nombre<input name="name" required minLength={2} defaultValue={zone.name} className="mt-2 min-h-11 w-full rounded-input border border-border px-4 outline-none focus-visible:ring-4 focus-visible:ring-brand/20" /></label>
        <label className="block text-sm font-bold text-ink">Estado<select name="active" defaultValue={String(zone.active)} className="mt-2 min-h-11 w-full rounded-input border border-border px-4"><option value="true">Activa</option><option value="false">Borrada</option></select></label>
        <button type="submit" className="rounded-pill border border-border px-4 py-2 text-sm font-bold text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20">Guardar</button>
      </form>
      {zone.active ? <button type="button" onClick={remove} className="rounded-pill border border-danger/30 px-4 py-2 text-sm font-bold text-danger focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-danger/20">Borrar zona</button> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-input bg-brand-tint px-4 py-3"><p className="text-xs font-bold uppercase tracking-wide text-brand">{label}</p><p className="mt-1 text-2xl font-extrabold text-brand-strong">{value}</p></div>;
}
