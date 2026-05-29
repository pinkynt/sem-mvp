"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { isValidPlate, normalizePlate, plateExample, plateExampleHint, plateMaxLength } from "@/lib/plate";
import type { VehicleKind } from "@/contracts/parking";

interface PlateInputProps {
  value: string;
  onChange: (value: string) => void;
  vehicleKind?: VehicleKind | null;
  label?: string;
  errorMessage?: string | null;
  className?: string;
}

export function PlateInput({
  value,
  onChange,
  vehicleKind,
  label = "Ingresá la patente",
  errorMessage,
  className,
}: PlateInputProps) {
  const id = useId();
  const [touched, setTouched] = useState(false);

  const example = plateExample(vehicleKind);
  const hint = plateExampleHint(vehicleKind);
  const maxLen = plateMaxLength(vehicleKind);

  const localError =
    value.length > 0 && !isValidPlate(value, vehicleKind) ? "Patente o formato inválido." : null;
  const showError = errorMessage ?? (touched ? localError : null);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-xl font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(normalizePlate(e.target.value).slice(0, maxLen))}
        onBlur={() => setTouched(true)}
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={maxLen}
        placeholder={example}
        aria-invalid={showError ? true : undefined}
        aria-describedby={showError ? errorId : hintId}
        className={cn(
          "h-16 w-full rounded-input border bg-surface text-center",
          "text-3xl font-bold uppercase tracking-[0.2em] text-ink",
          "placeholder:font-medium placeholder:tracking-[0.2em] placeholder:text-ink-soft/40",
          "outline-none transition-colors duration-150 ease-out",
          "focus-visible:ring-4",
          showError
            ? "border-danger focus-visible:border-danger focus-visible:ring-danger/25"
            : "border-border focus-visible:border-brand focus-visible:ring-brand/25",
        )}
      />
      {showError ? (
        <p id={errorId} role="alert" className="text-base font-semibold text-danger">
          {showError}
        </p>
      ) : (
        <p id={hintId} className="text-base text-ink-soft">
          Ejemplo: {hint}
        </p>
      )}
    </div>
  );
}
