"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    // Client-side empty-field validation
    const errors: { username?: string; password?: string } = {};
    if (!username) errors.username = "Este campo es obligatorio";
    if (!password) errors.password = "Este campo es obligatorio";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setPending(true);
    try {
      const response = await fetch("/api/permisionario/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, next: nextPath }),
      });

      if (response.ok) {
        const { redirectTo } = (await response.json()) as { redirectTo: string };
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => ({}));
      setError(
        typeof body?.error === "string"
          ? body.error
          : "No pudimos iniciar sesión.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-card border border-border bg-surface p-6 shadow-sm"
      noValidate
    >
      <div>
        <label className="text-sm font-bold text-ink" htmlFor="username">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          className="mt-2 min-h-12 w-full rounded-input border border-border px-4 outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          aria-invalid={!!fieldErrors.username}
          aria-describedby={fieldErrors.username ? "username-error" : undefined}
        />
        {fieldErrors.username && (
          <p
            id="username-error"
            className="mt-1 text-sm font-semibold text-danger"
          >
            {fieldErrors.username}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-bold text-ink" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-2 min-h-12 w-full rounded-input border border-border px-4 outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password && (
          <p
            id="password-error"
            className="mt-1 text-sm font-semibold text-danger"
          >
            {fieldErrors.password}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-input bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      <Button type="submit" loading={pending} fullWidth>
        Ingresar
      </Button>
    </form>
  );
}
