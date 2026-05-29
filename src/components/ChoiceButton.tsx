import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface ChoiceButtonProps {
  label: string;
  sublabel?: string;
  price?: string;
  icon?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

export function ChoiceButton({
  label,
  sublabel,
  price,
  icon,
  selected = false,
  onClick,
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full min-h-16 items-center gap-4 rounded-card border px-5 py-4 text-left",
        "transition-[background-color,border-color] duration-150 ease-out",
        "outline-none focus-visible:ring-4 focus-visible:ring-brand/30",
        selected
          ? "border-brand bg-brand-tint"
          : "border-border bg-surface hover:border-brand-soft",
      )}
    >
      {icon && (
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            selected ? "bg-brand text-white" : "bg-surface-muted text-brand",
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}

      <span className="flex flex-1 flex-col">
        <span className="text-xl font-bold text-ink">{label}</span>
        {sublabel && (
          <span className="text-base text-ink-soft">{sublabel}</span>
        )}
      </span>

      {price && (
        <span className="text-xl font-bold text-brand-strong">{price}</span>
      )}

      {selected && !price && (
        <Check className="size-6 shrink-0 text-brand" aria-hidden />
      )}
    </button>
  );
}
