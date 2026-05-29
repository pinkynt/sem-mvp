import { LoginForm } from "@/app/dashboard/login/LoginForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardLoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = await searchParams;
  const nextPath = first(params?.next);
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,oklch(0.95_0.03_250),transparent_34rem)] px-5 py-10">
      <section className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] bg-brand p-8 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/75">SEM Digital</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Panel municipal de control</h1>
          <p className="mt-5 max-w-prose text-lg text-white/82">Operaciones, permisionarios, tarifas y exportaciones del estacionamiento medido en una superficie institucional y segura.</p>
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-extrabold text-brand-strong">Acceso municipal</h2>
          <LoginForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value ?? ""; }
