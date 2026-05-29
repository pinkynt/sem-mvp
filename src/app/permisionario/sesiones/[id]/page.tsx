"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Bike, Car, ChevronLeft, ChevronRight, QrCode } from "lucide-react";
import { AppHeader, Button, StatusBadge } from "@/components";
import type { ParkingSessionDetailDto } from "@/contracts/parking";
import { getParkingPaymentStatus, getParkingSession } from "@/features/parking/api";
import { displayPlate, elapsedLabel, money, timeLabel } from "@/lib/parking-format";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [detail, setDetail] = useState<ParkingSessionDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getParkingSession(id)
      .then((data) => {
        if (!active) return;
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
  }, [id]);

  const session = detail?.session;
  const payment = detail?.payment;

  // Poll for prepago QR payment confirmation (mirrors cobrar/page.tsx R12 pattern)
  const isPrepagoPending =
    session?.kind === "prepago" &&
    session.status === "active" &&
    payment?.status === "pending" &&
    detail?.qr != null;
  const pollingPaymentId = isPrepagoPending ? payment?.id : null;

  useEffect(() => {
    if (!pollingPaymentId) return;
    const interval = window.setInterval(async () => {
      try {
        const status = await getParkingPaymentStatus(pollingPaymentId);
        if (status.receipt) {
          // Payment confirmed — re-fetch full detail to get updated session + payment state
          const updated = await getParkingSession(id);
          setDetail(updated);
        }
      } catch {
        // Polling is best-effort
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [pollingPaymentId, id]);

  const needsPrepaidCharge =
    session?.kind === "prepago" && session.status === "active" && !payment;

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-surface">
      <AppHeader name="" zone="" />

      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/permisionario/sesiones")}
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-pill text-brand outline-none transition-colors hover:bg-brand-tint focus-visible:ring-4 focus-visible:ring-brand/30"
        >
          <ChevronLeft className="size-6" />
        </button>
        <span className="text-sm font-semibold text-ink-soft">Detalle de sesión</span>
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
            <div className="flex items-center gap-4 rounded-card border border-border bg-surface p-5">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-brand" aria-hidden>
                {session.vehicleKind === "auto" ? <Car className="size-7" /> : <Bike className="size-7" />}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-extrabold tracking-[0.1em] text-ink">
                  {displayPlate(session.licensePlate)}
                </span>
                <span className="text-base text-ink-soft">{session.vehicleLabel}</span>
              </div>
              <div className="ml-auto">
                <StatusBadge
                  status={session.status === "active" ? "pendiente" : "efectivo"}
                  label={session.status === "active" ? "Activa" : "Finalizada"}
                />
              </div>
            </div>

            <dl className="flex flex-col divide-y divide-border rounded-card border border-border">
              <Row term="Tipo" value={session.kind === "prepago" ? "Prepago" : "Pospago"} />
              <Row term="Entrada" value={timeLabel(session.startedAt)} />
              {session.kind === "prepago" && session.validUntil && (
                <Row term="Válido hasta" value={timeLabel(session.validUntil)} />
              )}
              {session.kind === "pospago" && session.status === "active" && (
                <Row term="Tiempo transcurrido" value={elapsedLabel(session.elapsedMinutes)} />
              )}
              {payment && (
                <>
                  <Row term="Método de pago" value={payment.method === "cash" ? "Efectivo" : "QR Mercado Pago"} />
                  <Row term="Monto" value={money(payment.amountCents)} />
                </>
              )}
            </dl>

            {/* Prepago active without payment — charge happens in the dedicated /prepago route */}
            {needsPrepaidCharge && (
              <div className="mt-auto">
                <Button
                  fullWidth
                  onClick={() => router.push(`/permisionario/sesiones/${session.id}/prepago`)}
                >
                  <span className="flex items-center gap-2">
                    Completar cobro
                    <ChevronRight className="size-5" aria-hidden />
                  </span>
                </Button>
              </div>
            )}

            {/* Prepago QR pending — show QR + waiting state with 5s polling */}
            {session.kind === "prepago" &&
              session.status === "active" &&
              payment?.status === "pending" &&
              detail?.qr && (
                <div className="flex flex-col items-center gap-5 rounded-card border border-border bg-surface px-6 py-8 text-center">
                  <QrCode className="size-14 text-brand" aria-hidden />
                  <h2 className="text-3xl font-extrabold tracking-tight text-brand-strong">
                    Escanear QR
                  </h2>
                  <Image
                    src={detail.qr.qrImageDataUrl}
                    alt="QR Mercado Pago"
                    width={224}
                    height={224}
                    unoptimized
                    className="size-56 rounded-card border border-border bg-white p-3"
                  />
                  <p className="text-sm text-ink-soft">
                    El estado se actualiza automáticamente cuando Mercado Pago confirma el pago.
                  </p>
                  <StatusBadge status="pendiente" />
                </div>
              )}

            {/* Prepago confirmed — show valid receipt state, no QR */}
            {session.kind === "prepago" &&
              session.status === "active" &&
              payment?.status === "confirmed" && (
                <div className="rounded-card border border-border bg-surface px-5 py-4 text-center">
                  <StatusBadge status="confirmado" label="Pago confirmado" />
                </div>
              )}

            {session.kind === "pospago" && session.status === "active" && (
              <div className="mt-auto">
                <Button
                  fullWidth
                  onClick={() => router.push(`/permisionario/sesiones/${session.id}/cobrar`)}
                >
                  <span className="flex items-center gap-2">
                    Cobrar salida
                    <ChevronRight className="size-5" aria-hidden />
                  </span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <dt className="text-lg text-ink-soft">{term}</dt>
      <dd className="text-lg font-bold text-ink">{value}</dd>
    </div>
  );
}
