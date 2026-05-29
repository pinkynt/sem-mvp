"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { signInDashboard } from "@/app/dashboard/actions";

export function LoginForm({ nextPath = "" }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(signInDashboard, { error: "" });
  return (
    <form action={action} className="space-y-5 rounded-card border border-border bg-surface p-6 shadow-sm">
      <input type="hidden" name="next" value={nextPath} />
      <div>
        <label className="text-sm font-bold text-ink" htmlFor="email">Email municipal</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="mt-2 min-h-12 w-full rounded-input border border-border px-4 outline-none focus-visible:ring-4 focus-visible:ring-brand/20" />
      </div>
      <div>
        <label className="text-sm font-bold text-ink" htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="mt-2 min-h-12 w-full rounded-input border border-border px-4 outline-none focus-visible:ring-4 focus-visible:ring-brand/20" />
      </div>
      {state.error ? <p className="rounded-input bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{state.error}</p> : null}
      <Button type="submit" loading={pending} fullWidth>Ingresar al dashboard</Button>
    </form>
  );
}
