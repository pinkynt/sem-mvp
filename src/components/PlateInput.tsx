"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  example?: string;
  className?: string;
}

export function PlateInput({
  value,
  onChange,
  label = "Ingresá la patente",
  example = "AB123CD",
  className,
}: PlateInputProps) {
  const id = useId();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-xl font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 8))}
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder={example}
        aria-describedby={`${id}-hint`}
        className={cn(
          "h-16 w-full rounded-input border border-border bg-surface text-center",
          "text-3xl font-bold uppercase tracking-[0.2em] text-ink",
          "placeholder:font-medium placeholder:tracking-[0.2em] placeholder:text-ink-soft/40",
          "outline-none transition-colors duration-150 ease-out",
          "focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/25",
        )}
      />
      <p id={`${id}-hint`} className="text-base text-ink-soft">
        Ejemplo: {example}
      </p>
    </div>
  );
}
