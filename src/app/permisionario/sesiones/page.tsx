"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Car, ChevronLeft, Clock } from "lucide-react";
import { AppHeader, Button, StatusBadge } from "@/components";
import type { ParkingDashboardDto, ParkingSessionDto, PaymentDto } from "@/contracts/parking";
import { getPermitHolderHome } from "@/features/parking/api";
import { displayPlate, elapsedLabel, money, timeLabel } from "@/lib/parking-format";

function VehicleIcon({ kind }: { kind: ParkingSessionDto["vehicleKind"] }) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand" aria-hidden>
      {kind === "auto" ? <Car className="size-6" /> : <Bike className="size-6" />}
    </span>
  );
}

export default function SesionesPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ParkingDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPermitHolderHome()
      .then((data) => {
        if (!active) return;
        setDashboard(data);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las sesiones");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeSessions = dashboard?.activeSessions ?? [];
  const finishedSessions = (dashboard?.recentPayments ?? []).filter(
    (payment) => payment.sessionId && payment.status === "confirmed",
  );

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-surface">
      <AppHeader
        name={dashboard?.permitHolder.displayName.split(" ")[0] ?? "Juan"}
        zone={dashboard?.permitHolder.zone.name ?? "Centro A"}
      />

      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/permisionario")}
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-pill text-brand outline-none transition-colors hover:bg-brand-tint focus-visible:ring-4 focus-visible:ring-brand/30"
        >
          <ChevronLeft className="size-6" />
        </button>
        <span className="text-sm font-semibold text-ink-soft">Sesiones</span>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </div>
        )}

        <section aria-labelledby="active-title">
          <h2 id="active-title" className="mb-2 text-sm font-bold uppercase tracking-widest text-ink-soft">
            En curso
          </h2>
          {loading ? (
            <p className="text-base text-ink-soft">Cargando...</p>
          ) : activeSessions.length === 0 ? (
            <p className="text-base text-ink-soft">No hay sesiones en curso.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activeSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center gap-4 rounded-card border border-border bg-surface px-5 py-4"
                >
                  <VehicleIcon kind={session.vehicleKind} />
                  <div className="flex flex-1 flex-col">
                    <span className="text-lg font-bold tracking-wide text-ink">{displayPlate(session.licensePlate)}</span>
                    {session.kind === "prepago" ? (
                      <span className="text-base text-ink-soft">
                        {session.vehicleLabel} ·{" "}
                        {session.validUntil ? `válido hasta ${timeLabel(session.validUntil)}` : "prepago"}
                      </span>
                    ) : (
                      <span className="text-base text-ink-soft">
                        {session.vehicleLabel} · hace {elapsedLabel(session.elapsedMinutes)}
                      </span>
                    )}
                  </div>
                  {session.kind === "pospago" ? (
                    <Button onClick={() => router.push(`/permisionario/sesiones/${session.id}/cobrar`)}>
                      Cobrar
                    </Button>
                  ) : (
                    <Button onClick={() => router.push(`/permisionario/sesiones/${session.id}`)}>
                      Ver
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="finished-title">
          <h2 id="finished-title" className="mb-2 text-sm font-bold uppercase tracking-widest text-ink-soft">
            Finalizadas
          </h2>
          {loading ? (
            <p className="text-base text-ink-soft">Cargando...</p>
          ) : finishedSessions.length === 0 ? (
            <p className="text-base text-ink-soft">Todavía no hay sesiones finalizadas.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {finishedSessions.map((payment) => (
                <FinishedSessionItem key={payment.id} payment={payment} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function FinishedSessionItem({ payment }: { payment: PaymentDto }) {
  return (
    <li className="flex items-center gap-4 rounded-card border border-border bg-surface px-5 py-4">
      <VehicleIcon kind={payment.vehicleKind} />
      <div className="flex flex-1 flex-col">
        <span className="text-lg font-bold tracking-wide text-ink">{displayPlate(payment.licensePlate)}</span>
        <span className="flex items-center gap-1.5 text-base text-ink-soft">
          <Clock className="size-4" aria-hidden />
          {elapsedLabel(payment.durationMinutes)} · {timeLabel(payment.confirmedAt ?? payment.createdAt)}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-lg font-bold tabular-nums text-ink">{money(payment.amountCents)}</span>
        <StatusBadge status={payment.method === "cash" ? "efectivo" : "digital"} />
      </div>
    </li>
  );
}
