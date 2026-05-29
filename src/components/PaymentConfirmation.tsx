import { CheckCircle2 } from "lucide-react";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";

interface PaymentConfirmationProps {
  plate: string;
  validUntil: string;
  method: "efectivo" | "digital";
  code: string;
  onNew?: () => void;
}

export function PaymentConfirmation({
  plate,
  validUntil,
  method,
  code,
  onNew,
}: PaymentConfirmationProps) {
  return (
    <div className="flex flex-col items-center gap-7 rounded-card border border-border bg-surface px-6 py-9 text-center">
      <div className="flex flex-col items-center gap-3">
        <CheckCircle2 className="size-16 text-confirm" aria-hidden />
        <h2 className="text-3xl font-extrabold tracking-tight text-brand-strong">
          Pago confirmado
        </h2>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Patente
        </span>
        <span className="text-5xl font-extrabold tracking-[0.15em] text-ink">
          {plate}
        </span>
      </div>

      <dl className="flex w-full max-w-xs flex-col gap-3 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <dt className="text-ink-soft">Válido hasta</dt>
          <dd className="text-2xl font-bold tabular-nums text-ink">
            {validUntil}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-soft">Pago</dt>
          <dd>
            <StatusBadge status={method} />
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-soft">Código</dt>
          <dd className="font-semibold tracking-wide text-ink-soft">{code}</dd>
        </div>
      </dl>

      <Button variant="confirm" fullWidth onClick={onNew}>
        Nuevo cobro
      </Button>
    </div>
  );
}
