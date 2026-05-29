"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Banknote, ChevronLeft, LogOut, QrCode } from "lucide-react";
import { AppHeader, Button, ChoiceButton, StatusBadge } from "@/components";
import type {
  ParkingPaymentStatusDto,
  ParkingQrDto,
  ParkingQuoteDto,
  ParkingReceiptDto,
  PaymentMethod,
} from "@/contracts/parking";
import {
  closeParkingSession,
  getParkingPaymentStatus,
  quoteCloseParkingSession,
} from "@/features/parking/api";
import { displayPlate, elapsedLabel, money } from "@/lib/parking-format";
import { cn } from "@/lib/cn";

const PAYMENT_OPTIONS = [
  { id: "efectivo", label: "Efectivo", icon: <Banknote className="size-6" /> },
  { id: "qr", label: "QR Mercado Pago", icon: <QrCode className="size-6" /> },
] as const;

type PaymentId = (typeof PAYMENT_OPTIONS)[number]["id"];

type ResultState =
  | { kind: "qr"; paymentId: string; qr: ParkingQrDto; status: ParkingPaymentStatusDto | null }
  | { kind: "close"; receipt: ParkingReceiptDto; method: "efectivo" | "digital" };

export default function CobrarPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;

  const [step, setStep] = useState<"payment" | "confirm" | "done">("payment");
  const [payment, setPayment] = useState<PaymentId | null>(null);
  const [quote, setQuote] = useState<ParkingQuoteDto | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regionRef = useRef<HTMLDivElement>(null);
  // Track the paymentId we're polling for — null when not in QR mode
  const pollingPaymentId = result?.kind === "qr" ? result.paymentId : null;

  useEffect(() => {
    regionRef.current?.focus();
  }, [step]);

  // QR polling — always kind="close" (this route is pospago-only per design D7)
  useEffect(() => {
    if (!pollingPaymentId) return;
    const interval = window.setInterval(async () => {
      try {
        const status = await getParkingPaymentStatus(pollingPaymentId);
        setResult((current) =>
          current?.kind === "qr" ? { ...current, status } : current,
        );
        if (status.receipt) {
          setResult({
            kind: "close",
            receipt: status.receipt,
            method: "digital",
          });
        }
      } catch {
        // Polling is best-effort
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [pollingPaymentId]);

  async function choosePayment(nextPayment: PaymentId) {
    setPayment(nextPayment);
    setSubmitting(true);
    setError(null);
    try {
      const method: PaymentMethod = nextPayment === "efectivo" ? "cash" : "digital";
      setQuote(await quoteCloseParkingSession(sessionId, method));
      setStep("confirm");
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "No se pudo cotizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmClose() {
    if (!payment || !quote) return;
    setSubmitting(true);
    setError(null);
    try {
      const method: PaymentMethod = payment === "efectivo" ? "cash" : "digital";
      const response = await closeParkingSession(sessionId, { method });

      if (response.receipt) {
        setResult({
          kind: "close",
          receipt: response.receipt,
          method: payment === "efectivo" ? "efectivo" : "digital",
        });
        setStep("done");
      } else if (response.qr) {
        setResult({
          kind: "qr",
          paymentId: response.payment.id,
          qr: response.qr,
          status: null,
        });
        setStep("done");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo confirmar el cobro");
    } finally {
      setSubmitting(false);
    }
  }

  const paymentLabel = PAYMENT_OPTIONS.find((item) => item.id === payment)?.label;
  const confirmLabel = payment === "efectivo" ? "Cobré en efectivo" : "Mostrar QR Mercado Pago";

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-surface">
      <AppHeader name="" zone="" />

      {step !== "done" && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() =>
              step === "confirm"
                ? setStep("payment")
                : router.push(`/permisionario/sesiones/${sessionId}`)
            }
            aria-label="Volver"
            className="flex size-10 items-center justify-center rounded-pill text-brand outline-none transition-colors hover:bg-brand-tint focus-visible:ring-4 focus-visible:ring-brand/30"
          >
            <ChevronLeft className="size-6" />
          </button>
          <span className="text-sm font-semibold text-ink-soft">
            Cobrar salida · Paso {step === "payment" ? 1 : 2} de 2
          </span>
        </div>
      )}

      <div
        ref={regionRef}
        key={step}
        tabIndex={-1}
        className="step-in flex flex-1 flex-col gap-5 overflow-y-auto p-4 outline-none sm:gap-6 sm:p-6"
      >
        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </div>
        )}

        {step === "payment" && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">¿Cómo paga?</h2>
            <div className="flex flex-col gap-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <ChoiceButton
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={payment === opt.id}
                  onClick={() => void choosePayment(opt.id)}
                />
              ))}
            </div>
            {submitting && (
              <p className="text-center text-sm font-semibold text-ink-soft">Calculando importe...</p>
            )}
          </>
        )}

        {step === "confirm" && quote && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">Confirmar salida</h2>
            <dl className="flex flex-col divide-y divide-border rounded-card border border-border">
              <Row term="Tiempo" value={elapsedLabel(quote.durationMinutes)} />
              <Row term="Se cobra" value={`${quote.billedMinutes / 60} h`} />
              <Row term="Pago" value={paymentLabel ?? ""} />
              <div className="flex items-center justify-between px-5 py-4">
                <dt className="text-lg font-semibold text-ink-soft">Total</dt>
                <dd className="flex items-baseline gap-2">
                  {quote.discountCents > 0 && (
                    <span className="text-base text-ink-soft line-through">
                      {money(quote.baseAmountCents)}
                    </span>
                  )}
                  <span className="text-3xl font-extrabold text-brand-strong">
                    {money(quote.finalAmountCents)}
                  </span>
                </dd>
              </div>
            </dl>
            {quote.discountCents > 0 && (
              <p className="-mt-2 text-center text-sm font-semibold text-confirm-ink">
                Descuento digital aplicado: {quote.digitalDiscountPercent} %
              </p>
            )}
            <div className="mt-auto">
              <Button fullWidth disabled={submitting} onClick={() => void confirmClose()}>
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
            <p className="text-sm text-ink-soft">
              El estado se actualiza automáticamente cuando Mercado Pago confirma el cobro.
            </p>
            <StatusBadge
              status={result.status?.payment.status === "confirmed" ? "confirmado" : "pendiente"}
            />
            <Button fullWidth onClick={() => router.push("/permisionario")}>
              Volver al inicio
            </Button>
          </div>
        )}

        {step === "done" && result?.kind === "close" && (
          <CloseResult
            receipt={result.receipt}
            method={result.method}
            onNew={() => router.push("/permisionario")}
          />
        )}
      </div>
    </main>
  );
}

function CloseResult({
  receipt,
  method,
  onNew,
}: {
  receipt: ParkingReceiptDto;
  method: "efectivo" | "digital";
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-7 rounded-card border border-border bg-surface px-6 py-9 text-center">
      <div className="flex flex-col items-center gap-3">
        <LogOut className="size-16 text-confirm" aria-hidden />
        <h2 className="text-3xl font-extrabold tracking-tight text-brand-strong">Salida cobrada</h2>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Patente</span>
        <span className="text-5xl font-extrabold tracking-[0.15em] text-ink">
          {displayPlate(receipt.payment.licensePlate)}
        </span>
      </div>
      <dl className="flex w-full max-w-xs flex-col gap-3 border-t border-border pt-6">
        <SummaryRow term="Tiempo" value={elapsedLabel(receipt.quote.durationMinutes)} />
        <SummaryRow term="Total" value={money(receipt.payment.amountCents)} strong />
        <div className="flex items-center justify-between">
          <dt className="text-ink-soft">Pago</dt>
          <dd>
            <StatusBadge status={method} />
          </dd>
        </div>
      </dl>
      <Button variant="confirm" fullWidth onClick={onNew}>
        Listo
      </Button>
    </div>
  );
}

function SummaryRow({ term, value, strong }: { term: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-soft">{term}</dt>
      <dd className={cn("text-2xl font-bold tabular-nums", strong ? "text-brand-strong" : "text-ink")}>
        {value}
      </dd>
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
