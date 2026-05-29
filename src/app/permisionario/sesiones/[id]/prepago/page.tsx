"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Banknote, ChevronLeft, Clock, QrCode } from "lucide-react";
import { AppHeader, ChoiceButton } from "@/components";
import type {
  ParkingDashboardDto,
  ParkingSessionDetailDto,
  PaymentMethod,
} from "@/contracts/parking";
import { createParkingPayment, getParkingSession, getPermitHolderHome } from "@/features/parking/api";
import { displayPlate, money } from "@/lib/parking-format";

const DURATIONS = [
  { id: "1h", label: "1 hora", minutes: 60 },
  { id: "2h", label: "2 horas", minutes: 120 },
  { id: "3h", label: "3 horas", minutes: 180 },
];

const PAYMENT_OPTIONS = [
  { id: "cash", label: "Efectivo", icon: <Banknote className="size-6" /> },
  { id: "digital", label: "QR Mercado Pago", icon: <QrCode className="size-6" /> },
] as const;

export default function PrepagoChargePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [detail, setDetail] = useState<ParkingSessionDetailDto | null>(null);
  const [dashboard, setDashboard] = useState<ParkingDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timeId, setTimeId] = useState<string | null>(null);
  const [charging, setCharging] = useState(false);

  const detailHref = `/permisionario/sesiones/${id}`;

  useEffect(() => {
    if (!id) return;
    let active = true;
    getParkingSession(id)
      .then((data) => {
        if (!active) return;
        // Only prepago sessions still pending payment belong here.
        if (data.session.kind !== "prepago" || data.session.status !== "active" || data.payment) {
          router.replace(detailHref);
          return;
        }
        setDetail(data);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la sesión");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, detailHref, router]);

  useEffect(() => {
    let active = true;
    getPermitHolderHome()
      .then((data) => { if (active) setDashboard(data); })
      .catch(() => { /* non-critical: tariffs used for pricing only */ });
    return () => { active = false; };
  }, []);

  const session = detail?.session;
  const vehicle = dashboard?.tariffs.find((item) => item.vehicleKind === session?.vehicleKind) ?? null;

  function back() {
    if (timeId) {
      setTimeId(null);
      return;
    }
    router.push(detailHref);
  }

  async function chargePrepaid(method: PaymentMethod) {
    if (!session || !timeId) return;
    const duration = DURATIONS.find((item) => item.id === timeId);
    if (!duration) return;
    setCharging(true);
    setError(null);
    try {
      await createParkingPayment({
        licensePlate: session.licensePlate,
        vehicleKind: session.vehicleKind,
        method,
        durationMinutes: duration.minutes,
        sessionId: session.id,
      });
      router.push(detailHref);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo registrar el cobro");
      setCharging(false);
    }
  }

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-surface">
      <AppHeader name="" zone="" />

      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={back}
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-pill text-brand outline-none transition-colors hover:bg-brand-tint focus-visible:ring-4 focus-visible:ring-brand/30"
        >
          <ChevronLeft className="size-6" />
        </button>
        <span className="text-sm font-semibold text-ink-soft">Cobro prepago</span>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:gap-6 sm:p-6">
        {loading && <p className="text-base text-ink-soft">Cargando...</p>}

        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </div>
        )}

        {session && (
          <>
            <p className="text-sm font-semibold text-ink-soft">
              Patente {displayPlate(session.licensePlate)} · {session.vehicleLabel}
            </p>

            {!timeId ? (
              <>
                <h2 className="text-2xl font-extrabold tracking-tight text-ink">Elegí el tiempo</h2>
                <div className="flex flex-col gap-3">
                  {DURATIONS.map((opt) => (
                    <ChoiceButton
                      key={opt.id}
                      label={opt.label}
                      icon={<Clock className="size-6" />}
                      price={vehicle ? money((vehicle.hourlyRateCents * opt.minutes) / 60) : undefined}
                      onClick={() => setTimeId(opt.id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold tracking-tight text-ink">¿Cómo paga?</h2>
                  <button
                    type="button"
                    onClick={() => setTimeId(null)}
                    className="text-sm font-semibold text-brand outline-none hover:underline focus-visible:ring-4 focus-visible:ring-brand/30"
                  >
                    Cambiar tiempo
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <ChoiceButton
                      key={opt.id}
                      label={opt.label}
                      icon={opt.icon}
                      onClick={() => void chargePrepaid(opt.id)}
                    />
                  ))}
                </div>
                {charging && (
                  <p className="text-center text-sm font-semibold text-ink-soft">Procesando cobro...</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
