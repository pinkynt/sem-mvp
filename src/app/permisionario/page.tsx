"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Banknote,
  Bike,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  QrCode,
  TicketCheck,
  Timer,
} from "lucide-react";
import {
  AppHeader,
  Button,
  ChoiceButton,
  PaymentConfirmation,
  PlateInput,
  StatusBadge,
} from "@/components";
import type { Status } from "@/components";
import type {
  ParkingDashboardDto,
  ParkingPaymentStatusDto,
  ParkingQrDto,
  ParkingQuoteDto,
  ParkingReceiptDto,
  ParkingSessionDto,
  PaymentMethod,
  VehicleKind,
} from "@/contracts/parking";
import {
  closeParkingSession,
  createParkingPayment,
  getParkingPaymentStatus,
  getPermitHolderHome,
  openParkingSession,
  quoteCloseParkingSession,
  quoteParkingPayment,
} from "@/features/parking/api";
import { cn } from "@/lib/cn";

const DURATIONS = [
  { id: "1h", label: "1 hora", minutes: 60 },
  { id: "2h", label: "2 horas", minutes: 120 },
  { id: "3h", label: "3 horas", minutes: 180 },
];

const PAYMENT_OPTIONS = [
  { id: "efectivo", label: "Efectivo", icon: <Banknote className="size-6" /> },
  { id: "qr", label: "QR Mercado Pago", icon: <QrCode className="size-6" /> },
] as const;

type PaymentId = (typeof PAYMENT_OPTIONS)[number]["id"];
type Mode = "prepago" | "pospago";
type Step = "home" | "plate" | "kind" | "time" | "payment" | "confirm" | "openConfirm" | "done";

type Result =
  | { kind: "prepago"; receipt: ParkingReceiptDto; method: "efectivo" | "digital" }
  | { kind: "qr"; paymentId: string; qr: ParkingQrDto; status: ParkingPaymentStatusDto | null }
  | { kind: "open"; session: ParkingSessionDto }
  | { kind: "close"; receipt: ParkingReceiptDto; method: "efectivo" | "digital" };

const money = (cents: number) => `$${(cents / 100).toLocaleString("es-AR")}`;

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function elapsedLabel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function displayPlate(plate: string) {
  return plate.length === 7 ? `${plate.slice(0, 2)} ${plate.slice(2, 5)} ${plate.slice(5)}` : plate;
}

export default function PermisionarioPage() {
  const [dashboard, setDashboard] = useState<ParkingDashboardDto | null>(null);
  const [step, setStep] = useState<Step>("home");
  const [mode, setMode] = useState<Mode | null>(null);
  const [closing, setClosing] = useState(false);
  const [session, setSession] = useState<ParkingSessionDto | null>(null);
  const [plate, setPlate] = useState("");
  const [vehicleKind, setVehicleKind] = useState<VehicleKind | null>(null);
  const [timeId, setTimeId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentId | null>(null);
  const [quote, setQuote] = useState<ParkingQuoteDto | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    regionRef.current?.focus();
  }, [step]);

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (result?.kind !== "qr") return;
    const interval = window.setInterval(async () => {
      try {
        const status = await getParkingPaymentStatus(result.paymentId);
        setResult((current) => current?.kind === "qr" ? { ...current, status } : current);
        if (status.receipt) {
          setResult({
            kind: status.payment.sessionId ? "close" : "prepago",
            receipt: status.receipt,
            method: "digital",
          });
          await loadDashboard(false);
        }
      } catch {
        // Polling is best-effort; the user can retry by starting a new flow.
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [result]);

  const vehicle = dashboard?.tariffs.find((item) => item.vehicleKind === vehicleKind) ?? null;
  const duration = DURATIONS.find((item) => item.id === timeId) ?? null;
  const paymentMethod: PaymentMethod = payment === "efectivo" ? "cash" : "digital";
  const paymentLabel = PAYMENT_OPTIONS.find((item) => item.id === payment)?.label;

  const flow: Step[] = closing
    ? ["payment", "confirm"]
    : mode === "pospago"
      ? ["plate", "kind", "openConfirm"]
      : ["plate", "kind", "time", "payment", "confirm"];

  async function loadDashboard(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      setDashboard(await getPermitHolderHome());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el panel");
    } finally {
      setLoading(false);
    }
  }

  function back() {
    if (step === "plate") return setStep("home");
    if (step === "payment" && closing) return reset();
    const i = flow.indexOf(step);
    setStep(i > 0 ? flow[i - 1] : "home");
  }

  async function startClosingSession(activeSession: ParkingSessionDto) {
    setSession(activeSession);
    setMode("pospago");
    setClosing(true);
    setPlate(activeSession.licensePlate);
    setVehicleKind(activeSession.vehicleKind);
    setQuote(null);
    setStep("payment");
  }

  async function choosePayment(nextPayment: PaymentId) {
    if (!vehicleKind) return;
    setPayment(nextPayment);
    setSubmitting(true);
    setError(null);
    try {
      const method = nextPayment === "efectivo" ? "cash" : "digital";
      setQuote(
        closing && session
          ? await quoteCloseParkingSession(session.id, method)
          : await quoteParkingPayment({
              vehicleKind,
              method,
              durationMinutes: duration?.minutes ?? 60,
            }),
      );
      setStep("confirm");
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "No se pudo cotizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmCobro() {
    if (!payment || !vehicleKind) return;
    setSubmitting(true);
    setError(null);
    try {
      const method = paymentMethod;
      const response = closing && session
        ? await closeParkingSession(session.id, { method })
        : await createParkingPayment({
            licensePlate: plate,
            vehicleKind,
            method,
            durationMinutes: duration?.minutes ?? 60,
          });

      if (response.receipt) {
        setResult({
          kind: closing ? "close" : "prepago",
          receipt: response.receipt,
          method: method === "cash" ? "efectivo" : "digital",
        });
        await loadDashboard(false);
      } else if (response.qr) {
        setResult({ kind: "qr", paymentId: response.payment.id, qr: response.qr, status: null });
      }
      setStep("done");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo confirmar el cobro");
    } finally {
      setSubmitting(false);
    }
  }

  async function openSession() {
    if (!vehicleKind) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await openParkingSession({ licensePlate: plate, vehicleKind });
      setResult({ kind: "open", session: response.session });
      setStep("done");
      await loadDashboard(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo registrar la entrada");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setMode(null);
    setClosing(false);
    setSession(null);
    setPlate("");
    setVehicleKind(null);
    setTimeId(null);
    setPayment(null);
    setQuote(null);
    setResult(null);
    setError(null);
    setStep("home");
    void loadDashboard(false);
  }

  const confirmLabel = payment === "efectivo" ? "Cobré en efectivo" : "Mostrar QR Mercado Pago";
  const showCounter = !(mode === "pospago" && !closing);
  const stepLabel = closing ? "Cobrar salida" : mode === "pospago" ? "Registrar entrada" : "Nuevo cobro";
  const stepNumber = flow.indexOf(step) + 1;

  return (
    <main className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-surface shadow-sm">
      <AppHeader
        name={dashboard?.permitHolder.displayName.split(" ")[0] ?? "Juan"}
        zone={dashboard?.permitHolder.zone.name ?? "Centro A"}
      />

      {step !== "home" && step !== "done" && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={back}
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-pill text-brand outline-none transition-colors hover:bg-brand-tint focus-visible:ring-4 focus-visible:ring-brand/30"
          >
            <ChevronLeft className="size-6" />
          </button>
          <span className="text-sm font-semibold text-ink-soft">
            {stepLabel}
            {showCounter && ` · Paso ${stepNumber} de ${flow.length}`}
          </span>
        </div>
      )}

      <div
        ref={regionRef}
        key={step}
        tabIndex={-1}
        className="step-in flex flex-1 flex-col gap-6 overflow-y-auto p-6 outline-none"
      >
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </div>
        )}

        {step === "home" && (
          <>
            <div className="rounded-card border border-border p-5">
              <p className="text-sm font-semibold text-ink-soft">Total cobrado</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums text-brand-strong">
                {loading ? "..." : money(dashboard?.totals.accumulatedAmountCents ?? 0)}
              </p>
              <p className="mt-1 text-base text-ink-soft">
                Hoy: {dashboard?.totals.todayCount ?? 0} cobros · {money(dashboard?.totals.todayAmountCents ?? 0)}
              </p>
            </div>

            {(dashboard?.activeSessions.length ?? 0) > 0 && (
              <section aria-labelledby="active-title">
                <h2 id="active-title" className="mb-2 text-sm font-bold uppercase tracking-widest text-ink-soft">
                  Sesiones activas
                </h2>
                <ul className="flex flex-col gap-3">
                  {dashboard?.activeSessions.map((activeSession) => (
                    <li key={activeSession.id}>
                      <button
                        type="button"
                        onClick={() => void startClosingSession(activeSession)}
                        className="flex w-full items-center gap-4 rounded-card border border-border bg-surface px-5 py-4 text-left outline-none transition-[background-color,border-color] duration-150 ease-out hover:border-brand-soft focus-visible:ring-4 focus-visible:ring-brand/30"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand" aria-hidden>
                          {activeSession.vehicleKind === "auto" ? <Car className="size-6" /> : <Bike className="size-6" />}
                        </span>
                        <span className="flex flex-1 flex-col">
                          <span className="text-lg font-bold tracking-wide text-ink">{displayPlate(activeSession.licensePlate)}</span>
                          <span className="text-base text-ink-soft">
                            {activeSession.vehicleLabel} · hace {elapsedLabel(activeSession.elapsedMinutes)}
                          </span>
                        </span>
                        <StatusBadge status="pendiente" label="Cobrar salida" />
                        <ChevronRight className="size-5 shrink-0 text-ink-soft" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
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
          </>
        )}

        {step === "plate" && (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-xl font-bold text-ink">¿Qué vehículo es?</legend>
              <div className="grid grid-cols-2 gap-3">
                {(dashboard?.tariffs ?? []).map((tariff) => {
                  const selected = vehicleKind === tariff.vehicleKind;
                  const Icon = tariff.vehicleKind === "auto" ? Car : Bike;
                  return (
                    <button
                      key={tariff.vehicleKind}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setVehicleKind(tariff.vehicleKind)}
                      className={cn(
                        "flex flex-col items-center gap-3 rounded-card border px-4 py-7 text-center transition-[background-color,border-color] duration-150 ease-out outline-none focus-visible:ring-4 focus-visible:ring-brand/30",
                        selected ? "border-brand bg-brand-tint" : "border-border bg-surface hover:border-brand-soft",
                      )}
                    >
                      <span className={cn("flex size-16 items-center justify-center rounded-2xl", selected ? "bg-brand text-white" : "bg-surface-muted text-brand")} aria-hidden>
                        <Icon className="size-8" />
                      </span>
                      <span className="text-xl font-bold text-ink">{tariff.label}</span>
                      <span className="text-base text-ink-soft">{money(tariff.hourlyRateCents)} por hora</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <PlateInput value={plate} onChange={setPlate} />

            <div className="mt-auto">
              <Button fullWidth disabled={plate.length < 6 || !vehicleKind} onClick={() => setStep("kind")}>
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === "kind" && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">¿Cómo se cobra?</h2>
            <div className="flex flex-col gap-3">
              <ChoiceButton label="Prepago" sublabel="Cobra ahora por el tiempo elegido" icon={<Timer className="size-6" />} selected={mode === "prepago"} onClick={() => { setMode("prepago"); setStep("time"); }} />
              <ChoiceButton label="Pospago" sublabel="Registra la entrada, cobra al salir" icon={<LogIn className="size-6" />} selected={mode === "pospago"} onClick={() => { setMode("pospago"); setStep("openConfirm"); }} />
            </div>
          </>
        )}

        {step === "time" && vehicle && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Elegí el tiempo</h2>
            <div className="flex flex-col gap-3">
              {DURATIONS.map((opt) => (
                <ChoiceButton key={opt.id} label={opt.label} icon={<Clock className="size-6" />} price={money((vehicle.hourlyRateCents * opt.minutes) / 60)} selected={timeId === opt.id} onClick={() => { setTimeId(opt.id); setStep("payment"); }} />
              ))}
            </div>
          </>
        )}

        {step === "openConfirm" && vehicle && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Registrar entrada</h2>
            <dl className="flex flex-col divide-y divide-border rounded-card border border-border">
              <Row term="Patente" value={displayPlate(plate)} />
              <Row term="Vehículo" value={vehicle.label} />
              <Row term="Entrada" value={timeLabel(new Date().toISOString())} />
              <Row term="Tarifa" value={`${money(vehicle.hourlyRateCents)} por hora`} />
            </dl>
            <p className="-mt-2 text-center text-sm text-ink-soft">No se cobra ahora. El monto se calcula al registrar la salida.</p>
            <div className="mt-auto">
              <Button fullWidth disabled={submitting} onClick={() => void openSession()}>
                {submitting ? "Registrando..." : "Registrar entrada"}
              </Button>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">¿Cómo paga?</h2>
            <div className="flex flex-col gap-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <ChoiceButton key={opt.id} label={opt.label} icon={opt.icon} selected={payment === opt.id} onClick={() => void choosePayment(opt.id)} />
              ))}
            </div>
            {submitting && <p className="text-center text-sm font-semibold text-ink-soft">Calculando importe...</p>}
          </>
        )}

        {step === "confirm" && vehicle && quote && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">{closing ? "Confirmar salida" : "Confirmar cobro"}</h2>
            <dl className="flex flex-col divide-y divide-border rounded-card border border-border">
              <Row term="Patente" value={displayPlate(plate)} />
              <Row term="Vehículo" value={vehicle.label} />
              {closing && session ? (
                <>
                  <Row term="Tiempo" value={elapsedLabel(session.elapsedMinutes)} />
                  <Row term="Se cobra" value={`${quote.billedMinutes / 60} h`} />
                </>
              ) : (
                duration && <Row term="Tiempo" value={duration.label} />
              )}
              <Row term="Pago" value={paymentLabel ?? ""} />
              <div className="flex items-center justify-between px-5 py-4">
                <dt className="text-lg font-semibold text-ink-soft">Total</dt>
                <dd className="flex items-baseline gap-2">
                  {quote.discountCents > 0 && <span className="text-base text-ink-soft line-through">{money(quote.baseAmountCents)}</span>}
                  <span className="text-3xl font-extrabold text-brand-strong">{money(quote.finalAmountCents)}</span>
                </dd>
              </div>
            </dl>
            {quote.discountCents > 0 && <p className="-mt-2 text-center text-sm font-semibold text-confirm-ink">Descuento digital aplicado: {quote.digitalDiscountPercent} %</p>}
            <div className="mt-auto">
              <Button fullWidth disabled={submitting} onClick={() => void confirmCobro()}>
                {submitting ? "Procesando..." : confirmLabel}
              </Button>
            </div>
          </>
        )}

        {step === "done" && result?.kind === "qr" && (
          <div className="flex flex-col items-center gap-5 rounded-card border border-border bg-surface px-6 py-8 text-center">
            <QrCode className="size-14 text-brand" aria-hidden />
            <h2 className="text-3xl font-extrabold tracking-tight text-brand-strong">Escanear QR</h2>
            <Image
              src={result.qr.qrImageDataUrl}
              alt="QR Mercado Pago"
              width={224}
              height={224}
              unoptimized
              className="size-56 rounded-card border border-border bg-white p-3"
            />
            <p className="text-sm text-ink-soft">El estado se actualiza automáticamente cuando Mercado Pago confirma el cobro.</p>
            <StatusBadge status={result.status?.payment.status === "confirmed" ? "confirmado" : "pendiente"} />
            <Button fullWidth onClick={reset}>Volver al inicio</Button>
          </div>
        )}

        {step === "done" && result?.kind === "open" && (
          <div className="flex flex-col items-center gap-7 rounded-card border border-border bg-surface px-6 py-9 text-center">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="size-16 text-confirm" aria-hidden />
              <h2 className="text-3xl font-extrabold tracking-tight text-brand-strong">Entrada registrada</h2>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Patente</span>
              <span className="text-5xl font-extrabold tracking-[0.15em] text-ink">{displayPlate(result.session.licensePlate)}</span>
            </div>
            <dl className="flex w-full max-w-xs flex-col gap-3 border-t border-border pt-6">
              <SummaryRow term="Entrada" value={timeLabel(result.session.startedAt)} />
              <div className="flex items-center justify-between"><dt className="text-ink-soft">Estado</dt><dd><StatusBadge status="pendiente" label="Sesión activa" /></dd></div>
            </dl>
            <Button variant="confirm" fullWidth onClick={reset}>Listo</Button>
          </div>
        )}

        {step === "done" && result?.kind === "close" && (
          <CloseResult receipt={result.receipt} method={result.method} onNew={reset} />
        )}

        {step === "done" && result?.kind === "prepago" && (
          <PaymentConfirmation
            plate={displayPlate(result.receipt.payment.licensePlate)}
            validUntil={result.receipt.payment.validUntil ? timeLabel(result.receipt.payment.validUntil) : "-"}
            method={result.method}
            code={result.receipt.code}
            onNew={reset}
          />
        )}
      </div>

      {step === "home" && (
        <footer className="border-t border-border p-4">
          <Button fullWidth leftIcon={<TicketCheck className="size-6" />} disabled={loading || !dashboard} onClick={() => setStep("plate")}>
            Nuevo cobro
          </Button>
        </footer>
      )}
    </main>
  );
}

function statusFromPayment(method: PaymentMethod, status: string): Status {
  if (status === "pending") return "pendiente";
  return method === "cash" ? "efectivo" : "digital";
}

function CloseResult({ receipt, method, onNew }: { receipt: ParkingReceiptDto; method: "efectivo" | "digital"; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center gap-7 rounded-card border border-border bg-surface px-6 py-9 text-center">
      <div className="flex flex-col items-center gap-3">
        <LogOut className="size-16 text-confirm" aria-hidden />
        <h2 className="text-3xl font-extrabold tracking-tight text-brand-strong">Salida cobrada</h2>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Patente</span>
        <span className="text-5xl font-extrabold tracking-[0.15em] text-ink">{displayPlate(receipt.payment.licensePlate)}</span>
      </div>
      <dl className="flex w-full max-w-xs flex-col gap-3 border-t border-border pt-6">
        <SummaryRow term="Tiempo" value={elapsedLabel(receipt.quote.durationMinutes)} />
        <SummaryRow term="Total" value={money(receipt.payment.amountCents)} strong />
        <div className="flex items-center justify-between"><dt className="text-ink-soft">Pago</dt><dd><StatusBadge status={method} /></dd></div>
      </dl>
      <Button variant="confirm" fullWidth onClick={onNew}>Listo</Button>
    </div>
  );
}

function SummaryRow({ term, value, strong }: { term: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-soft">{term}</dt>
      <dd className={cn("text-2xl font-bold tabular-nums", strong ? "text-brand-strong" : "text-ink")}>{value}</dd>
    </div>
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
