import Image from "next/image";
import { LogOut, MapPin } from "lucide-react";

interface AppHeaderProps {
  name: string;
  zone: string;
  onLogout?: () => void;
}

export function AppHeader({ name, zone, onLogout }: AppHeaderProps) {
  return (
    <header className="bg-brand text-white">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white">
            <Image src="/brand-logo.png" alt="SEM" width={44} height={44} className="size-8" priority />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-base font-bold">Hola, {name}</span>
            <span className="truncate text-sm text-white/75">
              Sistema de estacionamiento medido
            </span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1.5 text-sm font-semibold whitespace-nowrap">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {zone}
          </span>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              aria-label="Cerrar sesión"
              className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white outline-none transition-colors hover:bg-white/25 focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
