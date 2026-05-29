"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Car, ChevronLeft, LogIn, Timer } from "lucide-react";
import { AppHeader, Button, ChoiceButton, PlateInput } from "@/components";
import type { ParkingDashboardDto, VehicleKind } from "@/contracts/parking";
import { getPermitHolderHome, openParkingSession } from "@/features/parking/api";
import { money } from "@/lib/parking-format";
import { cn } from "@/lib/cn";

type Mode = "prepago" | "pospago";
type Step = "plate" | "kind";

const FLOW: Step[] = ["plate", "kind"];

export default function NuevaPage() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<ParkingDashboardDto | null>(null);
  const [step, setStep] = useState<Step>("plate");
  const [plate, setPlate] = useState("");
  const [vehicleKind, setVehicleKind] = useState<VehicleKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    regionRef.current?.focus();
  }, [step]);

  useEffect(() => {
    let active = true;
    getPermitHolderHome()
      .then((data) => { if (active) setDashboard(data); })
      .catch(() => { /* non-critical: tariffs used for pricing only */ });
    return () => { active = false; };
  }, []);

  const stepNumber = FLOW.indexOf(step) + 1;

  function back() {
    if (step === "plate") {
      router.push("/permisionario");
      return;
    }
    setStep("plate");
  }

  async function createSession(mode: Mode) {
    if (!vehicleKind) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await openParkingSession({ licensePlate: plate, vehicleKind, kind: mode });
      router.push(`/permisionario/sesiones/${response.session.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la sesión");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-surface">
      <AppHeader
        name={dashboard?.permitHolder.displayName.split(" ")[0] ?? "Juan"}
        zone={dashboard?.permitHolder.zone.name ?? "Centro A"}
      />

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
          Nueva sesión · Paso {stepNumber} de {FLOW.length}
        </span>
      </div>

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

        {step === "plate" && (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-xl font-bold text-ink">¿Qué vehículo es?</legend>
              <div className="grid grid-cols-2 gap-3">
                {(dashboard?.tariffs ?? []).map((tariff) => {
                  const selected = vehicleKind === tariff.vehicleKind;
                  const Icon = tariff.vehicleKind === "auto" ? Car : Bike;
                  return (
                    <button
                      key={tariff.vehicleKind}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setVehicleKind(tariff.vehicleKind)}
                      className={cn(
                        "flex flex-col items-center gap-3 rounded-card border px-4 py-7 text-center transition-[background-color,border-color] duration-150 ease-out outline-none focus-visible:ring-4 focus-visible:ring-brand/30",
                        selected ? "border-brand bg-brand-tint" : "border-border bg-surface hover:border-brand-soft",
                      )}
                    >
                      <span className={cn("flex size-16 items-center justify-center rounded-2xl", selected ? "bg-brand text-white" : "bg-surface-muted text-brand")} aria-hidden>
                        <Icon className="size-8" />
                      </span>
                      <span className="text-xl font-bold text-ink">{tariff.label}</span>
                      <span className="text-base text-ink-soft">{money(tariff.hourlyRateCents)} por hora</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <PlateInput value={plate} onChange={setPlate} />

            <div className="mt-auto">
              <Button fullWidth disabled={plate.length < 6 || !vehicleKind} onClick={() => setStep("kind")}>
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === "kind" && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">¿Cómo se cobra?</h2>
            <div className="flex flex-col gap-3">
              <ChoiceButton
                label="Prepago"
                sublabel="Crea la sesión y cobra el tiempo en el detalle"
                icon={<Timer className="size-6" />}
                onClick={() => void createSession("prepago")}
              />
              <ChoiceButton
                label="Pospago"
                sublabel="Registra la entrada, cobra al salir"
                icon={<LogIn className="size-6" />}
                onClick={() => void createSession("pospago")}
              />
            </div>
            {submitting && (
              <p className="text-center text-sm font-semibold text-ink-soft">Creando sesión...</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
