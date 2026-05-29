"use client";

import { FormEvent, useState } from "react";
import { Bot, Send, UserRound } from "lucide-react";
import type { DashboardAiChatDto } from "@/contracts/dashboard";
import { cn } from "@/lib/cn";

type ChatMessage = { role: "assistant" | "user"; content: string };

const quickQuestions = [
  "Generá un informe del día",
  "Compará hoy contra ayer",
  "Qué zona tuvo más movimiento",
  "Qué medio de pago se usó más",
];

export function DashboardAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Puedo responder sobre recaudación, pagos, zonas, permisionarios, horarios y sesiones del día." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitMessage(nextInput = input) {
    const message = nextInput.trim();
    if (!message || loading) return;

    setInput("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", content: message }]);

    try {
      const response = await fetch("/api/dashboard/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("Chat request failed");
      const payload = (await response.json()) as DashboardAiChatDto;
      setMessages((current) => [...current, { role: "assistant", content: payload.reply }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "No pude generar una respuesta en este momento. Intentá nuevamente en unos segundos." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage();
  }

  return (
    <article className="rounded-card border border-border bg-surface p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Asistente SEM</p>
          <h2 className="mt-1 text-xl font-extrabold text-brand-strong">Chat de métricas municipales</h2>
        </div>
        <p className="max-w-lg text-sm font-semibold leading-6 text-ink-soft">
          Consultá informes simples con datos operativos agregados, sin exponer información sensible.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {quickQuestions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={loading}
            onClick={() => submitMessage(question)}
            className="rounded-pill border border-brand-soft/45 bg-brand-tint px-3 py-2 text-xs font-extrabold text-brand-strong transition hover:border-brand hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            {question}
          </button>
        ))}
      </div>

      <div className="mt-5 max-h-80 space-y-3 overflow-y-auto rounded-card bg-surface-muted p-3" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={cn("flex gap-3", message.role === "user" && "justify-end")}>
            {message.role === "assistant" && <Bot className="mt-2 size-5 shrink-0 text-brand" aria-hidden />}
            <p
              className={cn(
                "max-w-[82%] whitespace-pre-line rounded-input px-4 py-3 text-sm font-semibold leading-6 shadow-sm",
                message.role === "assistant" ? "bg-surface text-ink" : "bg-brand text-surface",
              )}
            >
              {message.content}
            </p>
            {message.role === "user" && <UserRound className="mt-2 size-5 shrink-0 text-brand" aria-hidden />}
          </div>
        ))}
        {loading && <p className="rounded-input bg-surface px-4 py-3 text-sm font-semibold text-ink-soft shadow-sm">Analizando métricas disponibles...</p>}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="dashboard-ai-chat-input">Pregunta para el asistente</label>
        <input
          id="dashboard-ai-chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={500}
          placeholder="Ejemplo: hacé un resumen para presentar al municipio"
          className="min-h-12 flex-1 rounded-input border border-border bg-surface px-4 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-tint"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-pill bg-brand px-5 text-sm font-extrabold text-surface transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Preguntar
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </article>
  );
}
