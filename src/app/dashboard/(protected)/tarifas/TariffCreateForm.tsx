"use client";

import { useState } from "react";
import type { ZoneDto } from "@/contracts/dashboard";

type ApiError = { error?: string };

const genericError = "No se pudo crear la tarifa. Revisá los datos ingresados e intentá nuevamente.";

export function TariffCreateForm({ zones }: { zones: ZoneDto[] }) {
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setError("");
    const hourlyRateCents = pesosToCents(String(formData.get("hourlyRatePesos") ?? ""));
    if (!hourlyRateCents) {
      setError("Ingresá un valor por hora válido en pesos.");
      return;
    }

    try {
      const response = await fetch("/api/dashboard/tariffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: String(formData.get("zoneId") ?? ""),
          vehicleKind: String(formData.get("vehicleKind") ?? ""),
          label: String(formData.get("label") ?? ""),
          hourlyRateCents,
          digitalDiscountPercent: Number(formData.get("digitalDiscountPercent") ?? 0),
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch((): ApiError => ({ error: genericError }));
        setError(result.error ?? genericError);
        return;
      }

      window.location.reload();
    } catch {
      setError(genericError);
    }
  }

  return (
    <form action={submit} className="mt-5 space-y-4">
      <label className="block text-sm font-bold text-ink">
        Zona
        <select name="zoneId" required className="mt-2 min-h-12 w-full rounded-input border border-border px-4">
          {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-bold text-ink">
        Tipo
        <select name="vehicleKind" className="mt-2 min-h-12 w-full rounded-input border border-border px-4">
          <option value="auto">Auto</option>
          <option value="moto">Moto</option>
        </select>
      </label>
      <Field name="label" label="Etiqueta" />
      <label className="block text-sm font-bold text-ink" htmlFor="hourlyRatePesos">
        Valor por hora
        <span className="mt-2 flex min-h-12 items-center rounded-input border border-border px-4 focus-within:ring-4 focus-within:ring-brand/20">
          <span className="text-ink-soft">$</span>
          <input id="hourlyRatePesos" name="hourlyRatePesos" type="number" min="1" step="1" required aria-describedby="hourlyRatePesos-help" className="min-h-10 w-full border-0 bg-transparent px-2 outline-none" />
        </span>
        <span id="hourlyRatePesos-help" className="mt-2 block text-xs font-semibold text-ink-soft">Ingresá el monto en pesos.</span>
      </label>
      <Field name="digitalDiscountPercent" label="Descuento digital (%)" type="number" />
      {error ? <p className="rounded-input bg-danger/10 px-4 py-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}
      <button className="rounded-pill bg-brand px-5 py-3 text-sm font-bold text-white" type="submit">Activar tarifa</button>
      <p className="text-xs text-ink-soft">No existe borrado destructivo de tarifas. Al activar una nueva, la anterior queda histórica y los pagos conservan sus montos.</p>
    </form>
  );
}

function pesosToCents(value: string) {
  const pesos = Number(value.replace(",", "."));
  if (!Number.isFinite(pesos) || pesos <= 0) return null;
  return Math.round(pesos * 100);
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) { return <label className="block text-sm font-bold text-ink">{label}<input name={name} type={type} required className="mt-2 min-h-12 w-full rounded-input border border-border px-4 outline-none focus-visible:ring-4 focus-visible:ring-brand/20" /></label>; }
