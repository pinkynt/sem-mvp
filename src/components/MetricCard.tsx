import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "brand";
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: MetricCardProps) {
  const brand = tone === "brand";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card p-6",
        brand
          ? "bg-brand text-white"
          : "border border-border bg-surface text-ink",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-sm font-semibold",
            brand ? "text-white/80" : "text-ink-soft",
          )}
        >
          {label}
        </span>
        {icon && (
          <span className={brand ? "text-white/90" : "text-brand"} aria-hidden>
            {icon}
          </span>
        )}
      </div>
      <span className="text-3xl font-extrabold tracking-tight tabular-nums">
        {value}
      </span>
      {hint && (
        <span
          className={cn(
            "text-sm",
            brand ? "text-white/75" : "text-ink-soft",
          )}
        >
          {hint}
        </span>
      )}
    </div>
  );
}
