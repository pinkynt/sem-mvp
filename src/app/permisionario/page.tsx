"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Clock,
  Banknote,
  QrCode,
  CreditCard,
  TicketCheck,
  Car,
  Bike,
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

const TOTAL_HOY = 8400;
const COBROS_HOY = 12;
const TOTAL_ACUMULADO = 1284500;

type PaymentId = (typeof PAYMENT_OPTIONS)[number]["id"];
type VehicleId = (typeof VEHICLES)[number]["id"];
type Step =
  | "home"
  | "plate"
  | "vehicle"
  | "time"
  | "payment"
  | "confirm"
  | "done";

const FLOW: Step[] = ["plate", "vehicle", "time", "payment", "confirm"];

const money = (n: number) => `$${n.toLocaleString("es-AR")}`;

function plusHours(hours: number) {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function PermisionarioPage() {
  const [step, setStep] = useState<Step>("home");
  const [plate, setPlate] = useState("");
  const [vehicleId, setVehicleId] = useState<VehicleId | null>(null);
  const [timeId, setTimeId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentId | null>(null);
  const [receipt, setReceipt] = useState<{
    validUntil: string;
    method: "efectivo" | "digital";
  } | null>(null);

  const regionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    regionRef.current?.focus();
  }, [step]);

  const vehicle = VEHICLES.find((v) => v.id === vehicleId) ?? null;
  const duration = DURATIONS.find((d) => d.id === timeId) ?? null;
  const isDigital = payment === "qr" || payment === "tarjeta";

  const total = useMemo(() => {
    if (!vehicle || !duration) return null;
    const base = vehicle.rate * duration.hours;
    return {
      base,
      final: isDigital ? Math.round(base * 0.8) : base,
      discounted: isDigital,
    };
  }, [vehicle, duration, isDigital]);

  function back() {
    setStep((s) => {
      if (s === "plate") return "home";
      const i = FLOW.indexOf(s);
      return i > 0 ? FLOW[i - 1] : "home";
    });
  }

  function confirmCobro() {
    if (!duration || !payment) return;
    setReceipt({
      validUntil: plusHours(duration.hours),
      method: isDigital ? "digital" : "efectivo",
    });
    setStep("done");
  }

  function reset() {
    setPlate("");
    setVehicleId(null);
    setTimeId(null);
    setPayment(null);
    setReceipt(null);
    setStep("home");
  }

  const stepNumber = FLOW.indexOf(step) + 1;
  const paymentLabel = PAYMENT_OPTIONS.find((p) => p.id === payment)?.label;
  const confirmLabel =
    payment === "efectivo"
      ? "Cobré en efectivo"
      : payment === "qr"
        ? "Mostrar QR Mercado Pago"
        : "Cobrar con tarjeta";

  return (
    <main className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-surface shadow-sm">
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
            Nuevo cobro · Paso {stepNumber} de {FLOW.length}
          </span>
        </div>
      )}

      <div
        ref={regionRef}
        key={step}
        tabIndex={-1}
        className="step-in flex flex-1 flex-col gap-6 overflow-y-auto p-6 outline-none"
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
            <PlateInput value={plate} onChange={setPlate} />
            <div className="mt-auto">
              <Button
                fullWidth
                disabled={plate.length < 6}
                onClick={() => setStep("vehicle")}
              >
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === "vehicle" && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              ¿Qué vehículo es?
            </h2>
            <div className="flex flex-col gap-3">
              {VEHICLES.map((v) => (
                <ChoiceButton
                  key={v.id}
                  label={v.label}
                  sublabel={`${money(v.rate)} por hora`}
                  icon={
                    v.id === "auto" ? (
                      <Car className="size-6" />
                    ) : (
                      <Bike className="size-6" />
                    )
                  }
                  selected={vehicleId === v.id}
                  onClick={() => {
                    setVehicleId(v.id);
                    setStep("time");
                  }}
                />
              ))}
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

        {step === "confirm" && vehicle && duration && total && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">
              Confirmar cobro
            </h2>
            <dl className="flex flex-col divide-y divide-border rounded-card border border-border">
              <Row term="Patente" value={plate} />
              <Row term="Vehículo" value={vehicle.label} />
              <Row term="Tiempo" value={duration.label} />
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

        {step === "done" && receipt && (
          <PaymentConfirmation
            plate={plate}
            validUntil={receipt.validUntil}
            method={receipt.method}
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
