import { MapPin } from "lucide-react";

interface AppHeaderProps {
  name: string;
  zone: string;
}

export function AppHeader({ name, zone }: AppHeaderProps) {
  return (
    <header className="bg-brand text-white">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg font-extrabold tracking-tight"
            aria-hidden
          >
            SEM
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-base font-bold">Hola, {name}</span>
            <span className="truncate text-sm text-white/75">
              Municipalidad de Salta
            </span>
          </span>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1.5 text-sm font-semibold whitespace-nowrap">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {zone}
        </span>
      </div>
    </header>
  );
}
