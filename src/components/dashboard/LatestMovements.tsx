"use client";

import { useEffect, useState } from "react";
import type { LatestMovementDto } from "@/contracts/dashboard";
import { formatCurrency, formatDateTime } from "@/components/dashboard/format";

export function LatestMovements({ initialMovements }: { initialMovements: LatestMovementDto[] }) {
  const [movements, setMovements] = useState(initialMovements);
  const [status, setStatus] = useState<"checking" | "polling" | "degraded">("checking");

  useEffect(() => {
    let cancelled = false;
    async function checkRealtime() {
      try {
        const response = await fetch("/api/dashboard/realtime", { cache: "no-store" });
        if (!response.ok) throw new Error("Realtime metadata failed");
        const metadata = (await response.json()) as { enabled?: boolean; fallback?: string };
        if (!cancelled) setStatus(metadata.enabled ? "polling" : "polling");
      } catch {
        if (!cancelled) setStatus("degraded");
      }
    }
    checkRealtime();
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/dashboard/movements/latest", { cache: "no-store" });
        if (!response.ok) throw new Error("Movement refresh failed");
        setMovements((await response.json()) as LatestMovementDto[]);
        setStatus("polling");
      } catch {
        setStatus("degraded");
      }
    }, 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  return (
    <div className="space-y-3">
      <p className="rounded-input bg-brand-tint/55 px-3 py-2 text-sm font-semibold text-brand-strong" role="status">{status === "degraded" ? "Actualización en vivo degradada. Se reintentará automáticamente cada 15 segundos." : status === "checking" ? "Verificando canal en vivo. Hay respaldo por refresco cada 15 segundos." : "Canal en vivo no disponible en este entorno. Respaldo activo cada 15 segundos."}</p>
      {movements.length === 0 ? <p className="text-sm text-ink-soft">Todavía no hay movimientos para mostrar.</p> : movements.map((movement) => (
        <article key={movement.id} className="flex items-start justify-between gap-4 rounded-input bg-surface-muted p-3">
          <div>
            <h3 className="font-bold text-ink">{movement.title}</h3>
            <p className="text-sm text-ink-soft">{movement.detail} · {formatDateTime(movement.createdAt)}</p>
          </div>
          <strong className="text-sm text-brand">{movement.amountCents === null ? "—" : formatCurrency(movement.amountCents)}</strong>
        </article>
      ))}
    </div>
  );
}
