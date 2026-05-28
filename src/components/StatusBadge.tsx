import {
  Check,
  Clock,
  AlertTriangle,
  Smartphone,
  Banknote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type Status =
  | "confirmado"
  | "pendiente"
  | "no-permitido"
  | "digital"
  | "efectivo";

const config: Record<Status, { label: string; icon: LucideIcon; className: string }> = {
  confirmado: {
    label: "Confirmado",
    icon: Check,
    className: "bg-confirm/20 text-confirm-ink",
  },
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-warn/25 text-warn-ink",
  },
  "no-permitido": {
    label: "No permitido",
    icon: AlertTriangle,
    className: "bg-danger/12 text-danger",
  },
  digital: {
    label: "Mercado Pago",
    icon: Smartphone,
    className: "bg-brand-tint text-brand",
  },
  efectivo: {
    label: "Efectivo",
    icon: Banknote,
    className: "bg-surface-muted text-brand-strong",
  },
};

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { label: defaultLabel, icon: Icon, className } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-semibold",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label ?? defaultLabel}
    </span>
  );
}
