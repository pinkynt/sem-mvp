import Link from "next/link";
import { LayoutDashboard, ReceiptText, Users, BadgeDollarSign, LogOut } from "lucide-react";
import { requireDashboardPageUser } from "@/server/dashboard/auth";
import { signOutDashboard } from "@/app/dashboard/actions";
import { Button } from "@/components/Button";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/operaciones", label: "Operaciones", icon: ReceiptText },
  { href: "/dashboard/permisionarios", label: "Permisionarios", icon: Users },
  { href: "/dashboard/tarifas", label: "Tarifas", icon: BadgeDollarSign },
];

export default async function DashboardProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireDashboardPageUser();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-surface/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">SEM Digital</p><h1 className="text-2xl font-extrabold text-brand-strong">Dashboard municipal</h1></div>
          <nav className="flex flex-wrap gap-2" aria-label="Dashboard municipal">
            {nav.map((item) => <Link key={item.href} href={item.href} className="inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-bold text-ink-soft hover:bg-brand-tint hover:text-brand"><item.icon className="size-4" aria-hidden />{item.label}</Link>)}
          </nav>
          <form action={signOutDashboard} className="flex items-center gap-3">
            <span className="text-sm font-semibold text-ink-soft">{user.displayName}</span>
            <Button type="submit" variant="secondary" className="min-h-11 px-4 text-sm" leftIcon={<LogOut className="size-4" />}>Salir</Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
