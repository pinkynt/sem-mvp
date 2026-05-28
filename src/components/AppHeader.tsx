import { MapPin } from "lucide-react";

interface AppHeaderProps {
  name: string;
  zone: string;
}

export function AppHeader({ name, zone }: AppHeaderProps) {
  return (
    <header className="bg-brand text-white">
      <div className="mx-auto flex max-w-md items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-xl bg-white/15 text-lg font-extrabold tracking-tight"
            aria-hidden
          >
            SEM
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold">Hola, {name}</span>
            <span className="text-sm text-white/75">
              Municipalidad de Salta
            </span>
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1.5 text-sm font-semibold">
          <MapPin className="size-4" aria-hidden />
          {zone}
        </span>
      </div>
    </header>
  );
}
