"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  Banknote,
  QrCode,
  Car,
  TicketCheck,
  Wallet,
  Building2,
} from "lucide-react";
import {
  AppHeader,
  Button,
  ChoiceButton,
  MetricCard,
  PaymentConfirmation,
  PlateInput,
  StatusBadge,
} from "@/components";

const TIME_OPTIONS = [
  { id: "1h", label: "1 hora", hours: 1, price: 700 },
  { id: "2h", label: "2 horas", hours: 2, price: 1400 },
  { id: "3h", label: "3 horas", hours: 3, price: 2100 },
];

const PAYMENT_OPTIONS = [
  { id: "efectivo", label: "Efectivo", icon: <Banknote className="size-6" /> },
  { id: "qr", label: "QR Mercado Pago", icon: <QrCode className="size-6" /> },
] as const;

type PaymentId = (typeof PAYMENT_OPTIONS)[number]["id"];

const money = (n: number) => `$${n.toLocaleString("es-AR")}`;

function plusHours(hours: number) {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function Home() {
  const [plate, setPlate] = useState("");
  const [timeId, setTimeId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentId | null>(null);
  const [receipt, setReceipt] = useState<{
    validUntil: string;
    method: "efectivo" | "digital";
  } | null>(null);

  const time = TIME_OPTIONS.find((t) => t.id === timeId) ?? null;
  const isDigital = payment === "qr";

  const total = useMemo(() => {
    if (!time) return null;
    const base = time.price;
    const final = isDigital ? Math.round(base * 0.8) : base;
    return { base, final, discounted: isDigital };
  }, [time, isDigital]);

  const ready = Boolean(plate.length >= 6 && time && payment);

  const confirmLabel =
    payment === "efectivo"
      ? "Cobré en efectivo"
      : payment === "qr"
        ? "Mostrar QR Mercado Pago"
        : "Confirmar cobro";

  function confirm() {
    if (!time || !payment) return;
    setReceipt({
      validUntil: plusHours(time.hours),
      method: isDigital ? "digital" : "efectivo",
    });
  }

  function reset() {
    setReceipt(null);
    setPlate("");
    setTimeId(null);
    setPayment(null);
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-5 py-10 lg:py-14">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-brand">
            SEM Digital
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink lg:text-5xl">
            Sistema de diseño
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            Componentes de interfaz para el cobro del estacionamiento medido,
            alineados a la identidad de la Municipalidad de Salta.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-14">
          {/* App del permisionario */}
          <section aria-labelledby="flow-title">
            <h2
              id="flow-title"
              className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-soft"
            >
              App del permisionario
            </h2>

            <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-sm">
              <AppHeader name="Juan" zone="Centro A" />

              <div className="flex flex-col gap-6 p-6">
                {receipt ? (
                  <PaymentConfirmation
                    plate={plate}
                    validUntil={receipt.validUntil}
                    method={receipt.method}
                    code="SEM-48291"
                    onNew={reset}
                  />
                ) : (
                  <>
                    <PlateInput value={plate} onChange={setPlate} />

                    <fieldset className="flex flex-col gap-3">
                      <legend className="mb-1 text-xl font-bold text-ink">
                        Elegí el tiempo
                      </legend>
                      {TIME_OPTIONS.map((opt) => (
                        <ChoiceButton
                          key={opt.id}
                          label={opt.label}
                          icon={<Clock className="size-6" />}
                          price={money(opt.price)}
                          selected={timeId === opt.id}
                          onClick={() => setTimeId(opt.id)}
                        />
                      ))}
                    </fieldset>

                    <fieldset className="flex flex-col gap-3">
                      <legend className="mb-1 text-xl font-bold text-ink">
                        ¿Cómo paga?
                      </legend>
                      {PAYMENT_OPTIONS.map((opt) => (
                        <ChoiceButton
                          key={opt.id}
                          label={opt.label}
                          icon={opt.icon}
                          selected={payment === opt.id}
                          onClick={() => setPayment(opt.id)}
                        />
                      ))}
                    </fieldset>

                    {total && (
                      <div className="flex items-baseline justify-between rounded-card bg-surface-muted px-5 py-4">
                        <span className="text-lg font-semibold text-ink-soft">
                          Total
                        </span>
                        <span className="flex items-baseline gap-2">
                          {total.discounted && (
                            <span className="text-base text-ink-soft line-through">
                              {money(total.base)}
                            </span>
                          )}
                          <span className="text-3xl font-extrabold text-brand-strong">
                            {money(total.final)}
                          </span>
                        </span>
                      </div>
                    )}

                    {total?.discounted && (
                      <p className="-mt-2 text-center text-sm font-semibold text-confirm-ink">
                        Descuento digital aplicado: 20 %
                      </p>
                    )}

                    <Button fullWidth disabled={!ready} onClick={confirm}>
                      {confirmLabel}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Galería + panel municipal */}
          <div className="flex flex-col gap-12">
            <section aria-labelledby="buttons-title">
              <h2
                id="buttons-title"
                className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-soft"
              >
                Botones
              </h2>
              <div className="flex flex-wrap gap-3">
                <Button leftIcon={<TicketCheck className="size-5" />}>
                  Nuevo cobro
                </Button>
                <Button variant="confirm">Pago confirmado</Button>
                <Button variant="secondary">Ver cobros</Button>
                <Button variant="danger">Anular cobro</Button>
                <Button loading>Procesando</Button>
                <Button disabled>Deshabilitado</Button>
              </div>
            </section>

            <section aria-labelledby="status-title">
              <h2
                id="status-title"
                className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-soft"
              >
                Estados
              </h2>
              <div className="flex flex-wrap gap-3">
                <StatusBadge status="confirmado" />
                <StatusBadge status="pendiente" />
                <StatusBadge status="no-permitido" />
                <StatusBadge status="digital" />
                <StatusBadge status="efectivo" />
              </div>
            </section>

            <section aria-labelledby="panel-title">
              <h2
                id="panel-title"
                className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-soft"
              >
                Panel municipal
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <MetricCard
                  label="Recaudación hoy"
                  value="$842.700"
                  hint="+12% vs. ayer"
                  tone="brand"
                  icon={<Wallet className="size-5" />}
                />
                <MetricCard
                  label="Cobros registrados"
                  value="1.204"
                  icon={<TicketCheck className="size-5" />}
                />
                <MetricCard
                  label="Pago digital"
                  value="38%"
                  hint="del total cobrado"
                  icon={<QrCode className="size-5" />}
                />
                <MetricCard
                  label="Pago efectivo"
                  value="62%"
                  icon={<Banknote className="size-5" />}
                />
                <MetricCard
                  label="Permisionarios"
                  value="312"
                  hint="activos hoy"
                  icon={<Car className="size-5" />}
                />
                <MetricCard
                  label="Zonas activas"
                  value="9"
                  icon={<Building2 className="size-5" />}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
