"use client";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function PasswordGenerateButton({ targetId = "password" }: { targetId?: string }) {
  return <button type="button" className="rounded-pill border border-border px-4 py-2 text-sm font-bold text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20" onClick={() => { const input = document.querySelector<HTMLInputElement>(`#${CSS.escape(targetId)}`); if (!input) return; const bytes = crypto.getRandomValues(new Uint8Array(8)); input.value = Array.from(bytes, (byte) => CHARS[byte % CHARS.length]).join(""); input.focus(); }}>Generar 8 caracteres</button>;
}
