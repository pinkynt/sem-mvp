"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeDollarSign, LayoutDashboard, Menu, ReceiptText, Users, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/operaciones", label: "Operaciones", icon: ReceiptText },
  { href: "/dashboard/permisionarios", label: "Permisionarios", icon: Users },
  { href: "/dashboard/tarifas", label: "Tarifas", icon: BadgeDollarSign },
];

export function DashboardShell({ children, signOutSlot }: { children: ReactNode; signOutSlot: ReactNode }) {
  const pathname = usePathname();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={cn("min-h-screen bg-canvas lg:grid", desktopCollapsed ? "lg:grid-cols-[5.5rem_1fr]" : "lg:grid-cols-[18rem_1fr]")}>
      {mobileOpen ? <button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-30 bg-ink/28 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}
      <aside
        id="dashboard-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-surface px-4 py-5 shadow-xl transition-[transform,width] duration-200 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          desktopCollapsed && "lg:w-[5.5rem] lg:px-3",
        )}
      >
        <div className={cn("flex items-center gap-3", desktopCollapsed && "lg:justify-center")}>
          <div className={cn("overflow-hidden rounded-[1.1rem] bg-surface-muted px-3 py-2", desktopCollapsed ? "lg:w-14 lg:px-1" : "w-full")}>
            <Image src="/logo.png" alt="Municipalidad de Salta" width={180} height={77} priority className="h-12 w-auto max-w-none" />
          </div>
          <button type="button" aria-label="Cerrar menú" className="rounded-pill border border-border p-2 text-brand lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className={cn("mt-6", desktopCollapsed && "lg:text-center")}>
          <p className={cn("text-xs font-bold uppercase tracking-[0.22em] text-brand", desktopCollapsed && "lg:sr-only")}>SEM Digital</p>
          <h1 className={cn("mt-1 text-2xl font-extrabold text-brand-strong", desktopCollapsed && "lg:sr-only")}>Dashboard municipal</h1>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-2" aria-label="Dashboard municipal">
          {nav.map((item) => {
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "inline-flex min-h-12 items-center gap-3 rounded-input px-3 text-sm font-bold transition-colors hover:bg-brand-tint hover:text-brand",
                  active ? "bg-brand text-white hover:bg-brand-hover hover:text-white" : "text-ink-soft",
                  desktopCollapsed && "lg:justify-center lg:px-0",
                )}
              >
                <item.icon className="size-5 shrink-0" aria-hidden />
                <span className={cn(desktopCollapsed && "lg:sr-only")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={cn("border-t border-border pt-4", desktopCollapsed && "lg:hidden")}>{signOutSlot}</div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95">
          <div className="flex min-h-16 items-center gap-3 px-5">
            <button type="button" aria-controls="dashboard-sidebar" aria-expanded={mobileOpen} aria-label="Abrir menú lateral" className="rounded-pill border border-border p-2.5 text-brand hover:bg-brand-tint lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" aria-hidden />
            </button>
            <button type="button" aria-controls="dashboard-sidebar" aria-expanded={!desktopCollapsed} aria-label="Alternar menú lateral" className="hidden rounded-pill border border-border p-2.5 text-brand hover:bg-brand-tint lg:inline-flex" onClick={() => setDesktopCollapsed((value) => !value)}>
              <Menu className="size-5" aria-hidden />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">SEM Digital</p>
              <p className="text-sm font-extrabold text-brand-strong">Panel municipal</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
