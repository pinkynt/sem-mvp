"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Banknote,
  QrCode,
  CreditCard,
  TicketCheck,
  Car,
  Bike,
  Timer,
  LogIn,
  LogOut,
  CheckCircle2,
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
import { cn } from "@/lib/cn";

const VEHICLES = [
  { id: "auto", label: "Auto", rate: 700 },
  { id: "moto", label: "Moto", rate: 300 },
] as const;

const DURATIONS = [
  { id: "1h", label: "1 hora", hours: 1 },
  { id: "2h", label: "2 horas", hours: 2 },
  { id: "3h", label: "3 horas", hours: 3 },
];

const PAYMENT_OPTIONS = [
  { id: "efectivo", label: "Efectivo", icon: <Banknote className="size-6" /> },
  { id: "qr", label: "QR Mercado Pago", icon: <QrCode className="size-6" /> },
  { id: "tarjeta", label: "Tarjeta", icon: <CreditCard className="size-6" /> },
] as const;

const RECENT_COBROS: {
  plate: string;
  when: string;
  amount: number;
  method: Extract<Status, "efectivo" | "digital">;
}[] = [
  { plate: "AB 123 CD", when: "Hace 5 min", amount: 700, method: "efectivo" },
  { plate: "AD 456 EF", when: "Hace 18 min", amount: 560, method: "digital" },
  { plate: "AC 789 GH", when: "Hace 32 min", amount: 1400, method: "efectivo" },
  { plate: "AA 012 IJ", when: "Hace 51 min", amount: 560, method: "digital" },
];

type VehicleId = (typeof VEHICLES)[number]["id"];

type ActiveSession = {
  id: string;
  plate: string;
  vehicleId: VehicleId;
  elapsedMin: number;
};

const ACTIVE_SESSIONS: ActiveSession[] = [
  { id: "s1", plate: "AF 220 KK", vehicleId: "auto", elapsedMin: 47 },
  { id: "s2", plate: "AG 884 LM", vehicleId: "moto", elapsedMin: 95 },
];

const TOTAL_HOY = 8400;
const COBROS_HOY = 12;
const TOTAL_ACUMULADO = 1284500;

type PaymentId = (typeof PAYMENT_OPTIONS)[number]["id"];
type Mode = "prepago" | "pospago";
type Step =
  | "home"
  | "plate"
  | "kind"
  | "time"
  | "payment"
  | "confirm"
  | "openConfirm"
  | "done";

type Result =
  | { kind: "prepago"; plate: string; validUntil: string; method: "efectivo" | "digital" }
  | { kind: "open"; plate: string; startedAt: string }
  | {
      kind: "close";
      plate: string;
      elapsed: string;
      total: number;
      method: "efectivo" | "digital";
    };

const money = (n: number) => `$${n.toLocaleString("es-AR")}`;

function plusHours(hours: number) {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function elapsedLabel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function PermisionarioPage() {
  const [step, setStep] = useState<Step>("home");
  const [mode, setMode] = useState<Mode | null>(null);
  const [closing, setClosing] = useState(false);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [plate, setPlate] = useState("");
  const [vehicleId, setVehicleId] = useState<VehicleId | null>(null);
  const [timeId, setTimeId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentId | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const regionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    regionRef.current?.focus();
  }, [step]);

  const vehicle = VEHICLES.find((v) => v.id === vehicleId) ?? null;
  const duration = DURATIONS.find((d) => d.id === timeId) ?? null;
  const isDigital = payment === "qr" || payment === "tarjeta";

  const billedHours = closing
    ? session
      ? Math.ceil(session.elapsedMin / 60)
      : null
    : (duration?.hours ?? null);

  const total = useMemo(() => {
    if (!vehicle || billedHours == null) return null;
    const base = vehicle.rate * billedHours;
    return {
      base,
      final: isDigital ? Math.round(base * 0.8) : base,
      discounted: isDigital,
    };
  }, [vehicle, billedHours, isDigital]);

  const flow = useMemo<Step[]>(() => {
    if (closing) return ["payment", "confirm"];
    if (mode === "pospago") return ["plate", "kind", "openConfirm"];
    return ["plate", "kind", "time", "payment", "confirm"];
  }, [closing, mode]);

  function back() {
    if (step === "plate") return setStep("home");
    if (step === "payment" && closing) return reset();
    const i = flow.indexOf(step);
    setStep(i > 0 ? flow[i - 1] : "home");
  }

  function startSession(s: ActiveSession) {
    setSession(s);
    setMode("pospago");
    setClosing(true);
    setPlate(s.plate);
    setVehicleId(s.vehicleId);
    setStep("payment");
  }

  function confirmCobro() {
    if (!payment || total == null) return;
    const method = isDigital ? "digital" : "efectivo";
    if (closing && session) {
      setResult({
        kind: "close",
        plate,
        elapsed: elapsedLabel(session.elapsedMin),
        total: total.final,
        method,
      });
    } else if (duration) {
      setResult({
        kind: "prepago",
        plate,
        validUntil: plusHours(duration.hours),
        method,
      });
    }
    setStep("done");
  }

  function openSession() {
    setResult({ kind: "open", plate, startedAt: plusHours(0) });
    setStep("done");
  }

  function reset() {
    setMode(null);
    setClosing(false);
    setSession(null);
    setPlate("");
    setVehicleId(null);
    setTimeId(null);
    setPayment(null);
    setResult(null);
    setStep("home");
  }

  const paymentLabel = PAYMENT_OPTIONS.find((p) => p.id === payment)?.label;
  const confirmLabel =
    payment === "efectivo"
      ? "Cobré en efectivo"
      : payment === "qr"
        ? "Mostrar QR Mercado Pago"
        : "Cobrar con tarjeta";

  const showCounter = !(mode === "pospago" && !closing);
  const stepLabel = closing
    ? "Cobrar salida"
    : mode === "pospago"
      ? "Registrar entrada"
      : "Nuevo cobro";
  const stepNumber = flow.indexOf(step) + 1;

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-surface">
      <AppHeader name="Juan" zone="Centro A" />

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
        className="step-in flex flex-1 flex-col gap-5 overflow-y-auto p-4 outline-none sm:gap-6 sm:p-6"
      >
        {step === "home" && (
          <>
            <div className="rounded-card border border-border p-5">
              <p className="text-sm font-semibold text-ink-soft">
                Total cobrado
              </p>
              <p className="text-4xl font-extrabold tracking-tight tabular-nums text-brand-strong">
                {money(TOTAL_ACUMULADO)}
              </p>
              <p className="mt-1 text-base text-ink-soft">
                Hoy: {COBROS_HOY} cobros · {money(TOTAL_HOY)}
              </p>
            </div>

            {ACTIVE_SESSIONS.length > 0 && (
              <section aria-labelledby="active-title">
                <h2
                  id="active-title"
                  className="mb-2 text-sm font-bold uppercase tracking-widest text-ink-soft"
                >
                  Sesiones activas
                </h2>
                <ul className="flex flex-col gap-3">
                  {ACTIVE_SESSIONS.map((s) => {
                    const v = VEHICLES.find((x) => x.id === s.vehicleId);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => startSession(s)}
                          className="flex w-full items-center gap-3 rounded-card border border-border bg-surface px-4 py-4 text-left outline-none transition-[background-color,border-color] duration-150 ease-out hover:border-brand-soft focus-visible:ring-4 focus-visible:ring-brand/30 sm:gap-4 sm:px-5"
                        >
                          <span
                            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand"
                            aria-hidden
                          >
                            {s.vehicleId === "auto" ? (
                              <Car className="size-6" />
                            ) : (
                              <Bike className="size-6" />
                            )}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <span className="truncate text-lg font-bold tracking-wide text-ink">
                              {s.plate}
                            </span>
                            <span className="truncate text-base text-ink-soft">
                              {v?.label} · hace {elapsedLabel(s.elapsedMin)}
                            </span>
                            <span className="flex">
                              <StatusBadge status="pendiente" label="Cobrar salida" />
                            </span>
                          </span>
                          <ChevronRight
                            className="size-5 shrink-0 self-center text-ink-soft"
                            aria-hidden
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section aria-labelledby="recent-title">
              <h2
                id="recent-title"
                className="mb-1 text-sm font-bold uppercase tracking-widest text-ink-soft"
              >
                Últimos cobros
              </h2>
              <ul className="divide-y divide-border">
                {RECENT_COBROS.map((c) => (
                  <li
                    key={c.plate}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-lg font-bold tracking-wide text-ink">
                        {c.plate}
                      </p>
                      <p className="text-sm text-ink-soft">{c.when}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-lg font-bold tabular-nums text-ink">
                        {money(c.amount)}
                      </span>
                      <StatusBadge status={c.method} />
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
              <legend className="mb-1 text-xl font-bold text-ink">
                ¿Qué vehículo es?
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLES.map((v) => {
                  const selected = vehicleId === v.id;
                  const Icon = v.id === "auto" ? Car : Bike;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setVehicleId(v.id)}
                      className={cn(
                        "flex flex-col items-center gap-3 rounded-card border px-4 py-7 text-center",
                        "transition-[background-color,border-color] duration-150 ease-out",
                        "outline-none focus-visible:ring-4 focus-visible:ring-brand/30",
                        selected
                          ? "border-brand bg-brand-tint"
                          : "border-border bg-surface hover:border-brand-soft",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-16 items-center justify-center rounded-2xl",
                          selected
                            ? "bg-brand text-white"
                            : "bg-surface-muted text-brand",
                        )}
                        aria-hidden
                      >
                        <Icon className="size-8" />
                      </span>
                      <span className="text-xl font-bold text-ink">
                        {v.label}
                      </span>
                      <span className="text-base text-ink-soft">
                        {money(v.rate)} por hora
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <PlateInput value={plate} onChange={setPlate} />

            <div className="mt-auto">
              <Button
                fullWidth
                disabled={plate.length < 6 || !vehicleId}
                onClick={() => setStep("kind")}
              >
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === "kind" && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              ¿Cómo se cobra?
            </h2>
            <div className="flex flex-col gap-3">
              <ChoiceButton
                label="Prepago"
                sublabel="Cobra ahora por el tiempo elegido"
                icon={<Timer className="size-6" />}
                selected={mode === "prepago"}
                onClick={() => {
                  setMode("prepago");
                  setStep("time");
                }}
              />
              <ChoiceButton
                label="Pospago"
                sublabel="Registra la entrada, cobra al salir"
                icon={<LogIn className="size-6" />}
                selected={mode === "pospago"}
                onClick={() => {
                  setMode("pospago");
                  setStep("openConfirm");
                }}
              />
            </div>
          </>
        )}

        {step === "time" && vehicle && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              Elegí el tiempo
            </h2>
            <div className="flex flex-col gap-3">
              {DURATIONS.map((opt) => (
                <ChoiceButton
                  key={opt.id}
                  label={opt.label}
                  icon={<Clock className="size-6" />}
                  price={money(vehicle.rate * opt.hours)}
                  selected={timeId === opt.id}
                  onClick={() => {
                    setTimeId(opt.id);
                    setStep("payment");
                  }}
                />
              ))}
            </div>
          </>
        )}

        {step === "openConfirm" && vehicle && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              Registrar entrada
            </h2>
            <dl className="flex flex-col divide-y divide-border rounded-card border border-border">
              <Row term="Patente" value={plate} />
              <Row term="Vehículo" value={vehicle.label} />
              <Row term="Entrada" value={plusHours(0)} />
              <Row term="Tarifa" value={`${money(vehicle.rate)} por hora`} />
            </dl>
            <p className="-mt-2 text-center text-sm text-ink-soft">
              No se cobra ahora. El monto se calcula al registrar la salida.
            </p>
            <div className="mt-auto">
              <Button fullWidth onClick={openSession}>
                Registrar entrada
              </Button>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              ¿Cómo paga?
            </h2>
            <div className="flex flex-col gap-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <ChoiceButton
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={payment === opt.id}
                  onClick={() => {
                    setPayment(opt.id);
                    setStep("confirm");
                  }}
                />
              ))}
            </div>
          </>
        )}

        {step === "confirm" && vehicle && total && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              {closing ? "Confirmar salida" : "Confirmar cobro"}
            </h2>
            <dl className="flex flex-col divide-y divide-border rounded-card border border-border">
              <Row term="Patente" value={plate} />
              <Row term="Vehículo" value={vehicle.label} />
              {closing && session ? (
                <>
                  <Row term="Tiempo" value={elapsedLabel(session.elapsedMin)} />
                  <Row term="Se cobra" value={`${billedHours} h`} />
                </>
              ) : (
                duration && <Row term="Tiempo" value={duration.label} />
              )}
              <Row term="Pago" value={paymentLabel ?? ""} />
              <div className="flex items-center justify-between px-5 py-4">
                <dt className="text-lg font-semibold text-ink-soft">Total</dt>
                <dd className="flex items-baseline gap-2">
                  {total.discounted && (
                    <span className="text-base text-ink-soft line-through">
                      {money(total.base)}
                    </span>
                  )}
                  <span className="text-3xl font-extrabold text-brand-strong">
                    {money(total.final)}
                  </span>
                </dd>
              </div>
            </dl>
            {total.discounted && (
              <p className="-mt-2 text-center text-sm font-semibold text-confirm-ink">
                Descuento digital aplicado: 20 %
              </p>
            )}
            <div className="mt-auto">
              <Button fullWidth onClick={confirmCobro}>
                {confirmLabel}
              </Button>
            </div>
          </>
        )}

        {step === "done" && result?.kind === "open" && (
          <div className="flex flex-col items-center gap-7 rounded-card border border-border bg-surface px-6 py-9 text-center">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="size-16 text-confirm" aria-hidden />
              <h2 className="text-3xl font-extrabold tracking-tight text-brand-strong">
                Entrada registrada
              </h2>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
                Patente
              </span>
              <span className="text-5xl font-extrabold tracking-[0.15em] text-ink">
                {result.plate}
              </span>
            </div>
            <dl className="flex w-full max-w-xs flex-col gap-3 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Entrada</dt>
                <dd className="text-2xl font-bold tabular-nums text-ink">
                  {result.startedAt}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Estado</dt>
                <dd>
                  <StatusBadge status="pendiente" label="Sesión activa" />
                </dd>
              </div>
            </dl>
            <Button variant="confirm" fullWidth onClick={reset}>
              Listo
            </Button>
          </div>
        )}

        {step === "done" && result?.kind === "close" && (
          <div className="flex flex-col items-center gap-7 rounded-card border border-border bg-surface px-6 py-9 text-center">
            <div className="flex flex-col items-center gap-3">
              <LogOut className="size-16 text-confirm" aria-hidden />
              <h2 className="text-3xl font-extrabold tracking-tight text-brand-strong">
                Salida cobrada
              </h2>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
                Patente
              </span>
              <span className="text-5xl font-extrabold tracking-[0.15em] text-ink">
                {result.plate}
              </span>
            </div>
            <dl className="flex w-full max-w-xs flex-col gap-3 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Tiempo</dt>
                <dd className="text-2xl font-bold tabular-nums text-ink">
                  {result.elapsed}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Total</dt>
                <dd className="text-2xl font-bold tabular-nums text-brand-strong">
                  {money(result.total)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Pago</dt>
                <dd>
                  <StatusBadge status={result.method} />
                </dd>
              </div>
            </dl>
            <Button variant="confirm" fullWidth onClick={reset}>
              Listo
            </Button>
          </div>
        )}

        {step === "done" && result?.kind === "prepago" && (
          <PaymentConfirmation
            plate={result.plate}
            validUntil={result.validUntil}
            method={result.method}
            code="SEM-48291"
            onNew={reset}
          />
        )}
      </div>

      {step === "home" && (
        <footer className="border-t border-border p-4">
          <Button
            fullWidth
            leftIcon={<TicketCheck className="size-6" />}
            onClick={() => setStep("plate")}
          >
            Nuevo cobro
          </Button>
        </footer>
      )}
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
