"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Car, ChevronRight, Clock, List, TicketCheck, Timer } from "lucide-react";
import { AppHeader, Button, StatusBadge } from "@/components";
import type { ParkingDashboardDto, ParkingSessionDto } from "@/contracts/parking";
import { getPermitHolderHome } from "@/features/parking/api";
import { displayPlate, elapsedLabel, money, statusFromPayment, timeLabel } from "@/lib/parking-format";
import { cn } from "@/lib/cn";

export default function PermisionarioPage() {
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
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el panel");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/permisionario/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    window.location.assign("/permisionario/login");
  }

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-surface">
      <AppHeader
        name={dashboard?.permitHolder.displayName.split(" ")[0] ?? ""}
        zone={dashboard?.permitHolder.zone.name ?? ""}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 outline-none sm:gap-6 sm:p-6">
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </div>
        )}

        <div className="rounded-card border border-border p-5">
          <p className="text-sm font-semibold text-ink-soft">Total cobrado</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums text-brand-strong">
            {loading ? "..." : money(dashboard?.totals.accumulatedAmountCents ?? 0)}
          </p>
          <p className="mt-1 text-base text-ink-soft">
            Hoy: {dashboard?.totals.todayCount ?? 0} cobros · {money(dashboard?.totals.todayAmountCents ?? 0)}
          </p>
        </div>

        {!loading && (
          <section aria-labelledby="active-title">
            <h2 id="active-title" className="mb-2 text-sm font-bold uppercase tracking-widest text-ink-soft">
              Sesiones activas
            </h2>
            {(dashboard?.activeSessions.length ?? 0) > 0 ? (
              <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
                {dashboard?.activeSessions.slice(0, 3).map((activeSession) => (
                  <ActiveSessionCard key={activeSession.id} session={activeSession} />
                ))}

                <button
                  type="button"
                  onClick={() => router.push("/permisionario/sesiones")}
                  className="flex w-32 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border text-brand outline-none transition-colors hover:border-brand-soft hover:bg-brand-tint focus-visible:ring-4 focus-visible:ring-brand/30"
                >
                  <List className="size-6" aria-hidden />
                  <span className="text-sm font-bold">Ver sesiones</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border px-5 py-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-muted text-ink-soft" aria-hidden>
                  <Timer className="size-6" />
                </span>
                <p className="text-base font-semibold text-ink-soft">No hay sesiones activas</p>
                <button
                  type="button"
                  onClick={() => router.push("/permisionario/sesiones")}
                  className="inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-sm font-bold text-brand outline-none transition-colors hover:bg-brand-tint focus-visible:ring-4 focus-visible:ring-brand/30"
                >
                  <List className="size-4" aria-hidden />
                  Ver sesiones
                </button>
              </div>
            )}
          </section>
        )}

        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className="mb-1 text-sm font-bold uppercase tracking-widest text-ink-soft">
            Últimos cobros
          </h2>
          <ul className="divide-y divide-border">
            {(dashboard?.recentPayments ?? []).map((recent) => (
              <li key={recent.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-lg font-bold tracking-wide text-ink">{displayPlate(recent.licensePlate)}</p>
                  <p className="text-sm text-ink-soft">{timeLabel(recent.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-lg font-bold tabular-nums text-ink">{money(recent.amountCents)}</span>
                  <StatusBadge status={statusFromPayment(recent.method, recent.status)} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="border-t border-border p-4">
        <Button
          fullWidth
          leftIcon={<TicketCheck className="size-6" />}
          disabled={loading || !dashboard}
          onClick={() => router.push("/permisionario/sesiones/nueva")}
        >
          Nuevo cobro
        </Button>
      </footer>
    </main>
  );
}

function ActiveSessionCard({ session }: { session: ParkingSessionDto }) {
  const router = useRouter();
  const isPrepago = session.kind === "prepago";

  return (
    <button
      type="button"
      onClick={() =>
        router.push(
          isPrepago
            ? `/permisionario/sesiones/${session.id}`
            : `/permisionario/sesiones/${session.id}/cobrar`,
        )
      }
      className="flex w-44 shrink-0 snap-start flex-col gap-3 rounded-card border border-border bg-surface p-4 text-left outline-none transition-[background-color,border-color] duration-150 ease-out hover:border-brand-soft focus-visible:ring-4 focus-visible:ring-brand/30"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand" aria-hidden>
        {session.vehicleKind === "auto" ? <Car className="size-5" /> : <Bike className="size-5" />}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-lg font-bold tracking-wide text-ink">{displayPlate(session.licensePlate)}</span>
        <span className={cn("inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold tabular-nums", isPrepago ? "text-confirm-ink" : "text-ink-soft")}>
          <Clock className="size-4 shrink-0" aria-hidden />
          {isPrepago && session.validUntil
            ? `hasta ${timeLabel(session.validUntil)}`
            : elapsedLabel(session.elapsedMinutes)}
        </span>
      </span>
      {!isPrepago && (
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-brand">
          Cobrar salida
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
      {isPrepago && (
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-ink-soft">
          Ver detalle
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </button>
  );
}
