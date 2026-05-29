import Image from "next/image";
import { redirect } from "next/navigation";
import { readPermitHolderSession } from "@/server/permisionario/auth";
import { LoginForm } from "./LoginForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PermisionarioLoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await readPermitHolderSession();
  if (session) redirect("/permisionario");

  const params = await searchParams;
  const rawNext = typeof params?.next === "string" ? params.next : "";
  const nextPath = safeNext(rawNext);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,oklch(0.95_0.03_250),transparent_34rem)] px-5 py-10">
      <section className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] bg-brand p-8 text-white shadow-xl">
          <div className="inline-flex rounded-[1.25rem] bg-white/95 px-4 py-3 shadow-sm">
            <Image
              src="/brand-logo.png"
              alt="SEM"
              width={44}
              height={44}
              className="size-8"
              priority
            />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.22em] text-white/75">
            SEM Digital
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Acceso permisionario
          </h1>
          <p className="mt-5 max-w-prose text-lg text-white/82">
            Gestioná tus cobros, sesiones y pagos del estacionamiento medido.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-extrabold text-brand-strong">
            Acceso permisionario
          </h2>
          <LoginForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}

function safeNext(value: string) {
  if (
    !value.startsWith("/permisionario") ||
    value.startsWith("/permisionario/login")
  ) {
    return "/permisionario";
  }
  return value;
}
