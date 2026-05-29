"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState, useTransition } from "react";
import type { PermitHolderAdminDto, ZoneDto } from "@/contracts/dashboard";
import { DashboardBadge } from "@/components/dashboard/DashboardBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { PasswordGenerateButton } from "@/app/dashboard/(protected)/permisionarios/PasswordGenerateButton";

const columns: ColumnDef<PermitHolderAdminDto>[] = [
  { accessorKey: "displayName", header: "Nombre", cell: ({ row }) => <strong>{row.original.displayName}</strong> },
  { accessorKey: "fileNumber", header: "Legajo" },
  { accessorKey: "zoneName", header: "Zona" },
  { accessorKey: "active", header: "Estado", cell: ({ row }) => <DashboardBadge tone={row.original.active ? "confirmed" : "failed"}>{row.original.active ? "Activo" : "Inactivo"}</DashboardBadge> },
  { id: "account", header: "Usuario de acceso", cell: ({ row }) => row.original.account ? <DashboardBadge tone={row.original.account.active ? "digital" : "neutral"}>{row.original.account.username}</DashboardBadge> : "Sin usuario" },
];

export function PermitHoldersTable({ rows, zones }: { rows: PermitHolderAdminDto[]; zones: ZoneDto[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const columnsWithActions: ColumnDef<PermitHolderAdminDto>[] = [
    ...columns,
    { id: "actions", header: "Acciones", enableHiding: false, cell: ({ row }) => <button type="button" className="rounded-pill border border-border px-3 py-2 text-xs font-bold text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20" onClick={() => setEditingId((current) => current === row.original.id ? null : row.original.id)} aria-expanded={editingId === row.original.id}>{editingId === row.original.id ? "Cerrar" : "Editar"}</button> },
  ];
  const selected = rows.find((row) => row.id === editingId) ?? null;

  return <div className="space-y-4"><DataTable columns={columnsWithActions} data={rows} searchPlaceholder="Filtrar permisionarios" />{selected && <PermitHolderEditor holder={selected} zones={zones} />}</div>;
}

function PermitHolderEditor({ holder, zones }: { holder: PermitHolderAdminDto; zones: ZoneDto[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const passwordId = `password-${holder.id}`;
  const resetPasswordId = `reset-password-${holder.id}`;

  async function submit(formData: FormData) {
    const body = {
      displayName: String(formData.get("displayName") ?? ""),
      fileNumber: String(formData.get("fileNumber") ?? ""),
      zoneId: String(formData.get("zoneId") ?? ""),
      active: String(formData.get("active") ?? "true") === "true",
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      accountActive: String(formData.get("accountActive") ?? "true") === "true",
    };
    setError("");
    const response = await fetch(`/api/dashboard/permit-holders/${holder.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "No pudimos guardar los cambios." }));
      setError(String(result.error ?? "No pudimos guardar los cambios."));
      return;
    }
    window.location.reload();
  }

  async function toggleActive(active: boolean) {
    startTransition(async () => {
      await fetch(`/api/dashboard/permit-holders/${holder.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
      window.location.reload();
    });
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-sm" aria-label={`Editar ${holder.displayName}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div><h3 className="text-xl font-extrabold text-brand-strong">Editar {holder.displayName}</h3><p className="text-sm text-ink-soft">Los cambios mantienen visible el historial operativo.</p></div>
        <button type="button" disabled={isPending} onClick={() => toggleActive(!holder.active)} className="rounded-pill border border-border px-4 py-2 text-sm font-bold text-brand disabled:opacity-50">{holder.active ? "Desactivar" : "Reactivar"}</button>
      </div>
      <form action={submit} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field name="displayName" label="Nombre completo" defaultValue={holder.displayName} />
        <Field name="fileNumber" label="Legajo municipal" defaultValue={holder.fileNumber} />
        <label className="block text-sm font-bold text-ink">Zona asignada<select name="zoneId" defaultValue={holder.zoneId} required className="mt-2 min-h-12 w-full rounded-input border border-border px-4">{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
        <label className="block text-sm font-bold text-ink">Estado del permisionario<select name="active" defaultValue={String(holder.active)} className="mt-2 min-h-12 w-full rounded-input border border-border px-4"><option value="true">Activo</option><option value="false">Inactivo</option></select></label>
        <Field name="username" label="Usuario de acceso" defaultValue={holder.account?.username ?? ""} />
        <label className="block text-sm font-bold text-ink">Estado del acceso<select name="accountActive" defaultValue={String(holder.account?.active ?? true)} className="mt-2 min-h-12 w-full rounded-input border border-border px-4"><option value="true">Activo</option><option value="false">Inactivo</option></select></label>
        <div className="md:col-span-2"><Field id={passwordId} name="password" label={holder.account ? "Nueva contraseña de acceso (opcional)" : "Contraseña de acceso"} type="text" /><div className="mt-2"><PasswordGenerateButton targetId={passwordId} /></div><p className="mt-2 text-xs text-ink-soft">Al guardar, el servidor reemplaza el valor por un hash scrypt. Nunca se almacena texto plano.</p></div>
        {error ? <p className="rounded-input bg-danger/10 px-4 py-3 text-sm font-semibold text-danger md:col-span-2" role="alert">{error}</p> : null}
        <button className="rounded-pill bg-brand px-5 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 md:col-span-2" type="submit">Guardar cambios</button>
      </form>
      {holder.account && <form action={submit} className="mt-5 rounded-input bg-brand-tint/50 p-4"><input type="hidden" name="displayName" value={holder.displayName} /><input type="hidden" name="fileNumber" value={holder.fileNumber} /><input type="hidden" name="zoneId" value={holder.zoneId} /><input type="hidden" name="active" value={String(holder.active)} /><input type="hidden" name="username" value={holder.account.username} /><input type="hidden" name="accountActive" value={String(holder.account.active)} /><Field id={resetPasswordId} name="password" label="Nueva contraseña de acceso" type="text" /><div className="mt-3 flex flex-wrap gap-2"><PasswordGenerateButton targetId={resetPasswordId} /><button className="rounded-pill bg-brand px-5 py-2 text-sm font-bold text-white" type="submit">Guardar contraseña</button></div></form>}
    </section>
  );
}

function Field({ name, label, defaultValue = "", type = "text", id }: { name: string; label: string; defaultValue?: string; type?: string; id?: string }) { return <label className="block text-sm font-bold text-ink" htmlFor={id ?? name}>{label}<input id={id ?? name} name={name} type={type} defaultValue={defaultValue} className="mt-2 min-h-12 w-full rounded-input border border-border px-4 outline-none focus-visible:ring-4 focus-visible:ring-brand/20" /></label>; }
