"use client";

import { useState } from "react";
import type { ZoneDto } from "@/contracts/dashboard";
import { PasswordGenerateButton } from "@/app/dashboard/(protected)/permisionarios/PasswordGenerateButton";

type ApiError = { error?: string; field?: string; code?: string };

export function QuickCreatePermitHolderForm({ zones }: { zones: ZoneDto[] }) {
  const [error, setError] = useState<ApiError | null>(null);
  const fieldError = (field: string) => error?.field === field ? error.error ?? "" : "";

  if (zones.length === 0) {
    return <p className="mt-5 rounded-input bg-danger/10 px-4 py-3 text-sm font-semibold text-danger" role="alert">No hay zonas activas para asignar. Cargá una zona antes de crear permisionarios.</p>;
  }

  async function submit(formData: FormData) {
    setError(null);
    const response = await fetch("/api/dashboard/permit-holders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(formData.get("displayName") ?? ""),
        fileNumber: String(formData.get("fileNumber") ?? ""),
        zoneId: String(formData.get("zoneId") ?? ""),
        active: true,
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
        accountActive: true,
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "No pudimos guardar el permisionario." }));
      setError(result);
      return;
    }

    window.location.reload();
  }

  return (
    <form action={submit} className="mt-5 space-y-4">
      <Field name="displayName" label="Nombre" required minLength={2} error={fieldError("displayName")} />
      <Field name="fileNumber" label="Legajo" required minLength={1} error={fieldError("fileNumber")} />
      <label className="block text-sm font-bold text-ink">
        Zona
        <select name="zoneId" required aria-invalid={fieldError("zoneId") ? true : undefined} aria-describedby={fieldError("zoneId") ? "zoneId-error" : undefined} className="mt-2 min-h-12 w-full rounded-input border border-border px-4">
          {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
        </select>
        {fieldError("zoneId") ? <span id="zoneId-error" className="mt-2 block text-sm font-semibold text-danger">{fieldError("zoneId")}</span> : null}
      </label>
      <Field name="username" label="Clave" minLength={3} error={fieldError("username")} />
      <div>
        <Field id="password" name="password" label="Contraseña" type="text" error={fieldError("password")} />
        <div className="mt-2"><PasswordGenerateButton /></div>
        <p className="mt-2 text-xs text-ink-soft">Se guarda sólo hash scrypt. La contraseña no se puede recuperar.</p>
      </div>
      {error?.error && !error.field ? <p className="rounded-input bg-danger/10 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error.error}</p> : null}
      <button className="rounded-pill bg-brand px-5 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20" type="submit">Guardar permisionario</button>
    </form>
  );
}

function Field({ name, label, defaultValue = "", type = "text", id, error = "", required = false, minLength }: { name: string; label: string; defaultValue?: string; type?: string; id?: string; error?: string; required?: boolean; minLength?: number }) {
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;
  return (
    <label className="block text-sm font-bold text-ink" htmlFor={inputId}>
      {label}
      <input id={inputId} name={name} type={type} defaultValue={defaultValue} required={required} minLength={minLength} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} className="mt-2 min-h-12 w-full rounded-input border border-border px-4 outline-none focus-visible:ring-4 focus-visible:ring-brand/20" />
      {error ? <span id={errorId} className="mt-2 block text-sm font-semibold text-danger">{error}</span> : null}
    </label>
  );
}
