import { createAdminClient } from "@/utils/supabase/admin";
import type { DashboardAiChatDto, DashboardAiInsightsDto, PaymentMethod, PaymentStatus } from "@/contracts/dashboard";

const INSUFFICIENT_INSIGHT = "Aún no hay datos suficientes para generar una lectura confiable.";
const TITLE: DashboardAiInsightsDto["title"] = "Lectura inteligente del día";
const DEFAULT_KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const DEFAULT_KIMI_MODEL = "kimi-k2.6";
const KIMI_CODE_BASE_URL = "https://api.kimi.com/coding";
const KIMI_CODE_MODEL = "kimi-for-coding";
const MAX_INSIGHTS = 3;
const MAX_CHAT_CHARS = 900;

type KimiConfig = { apiKey: string; baseUrl: string; model: string; protocol: "openai" | "anthropic" };

type InsightPaymentRow = {
  amount_cents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  duration_minutes: number;
  created_at: string;
  zones: { name: string } | null;
  permit_holders: { display_name: string } | null;
};

type InsightSessionRow = {
  status: "active" | "closed";
  created_at: string;
};

type CountedValue = { name: string; count: number; revenueCents: number };

type InsightMetrics = {
  today: {
    revenueCents: number;
    confirmedPayments: number;
    digitalPayments: number;
    cashPayments: number;
    averageDurationMinutes: number | null;
  };
  yesterday: {
    revenueCents: number;
    confirmedPayments: number;
  };
  paymentMethods: {
    cash: { count: number; revenueCents: number };
    digital: { count: number; revenueCents: number };
  };
  timeBands: Record<"morning" | "afternoon" | "night", { label: string; count: number; revenueCents: number }>;
  topZone: CountedValue | null;
  topPermitHolder: CountedValue | null;
  sessionsToday: { active: number; closed: number };
};

export async function getDashboardAiInsights(): Promise<DashboardAiInsightsDto> {
  const metrics = await getInsightMetrics();

  if (!hasEnoughData(metrics)) {
    return insufficientInsights();
  }

  const kimiInsights = await getKimiInsights(metrics).catch(() => null);
  return kimiInsights ?? buildDeterministicInsights(metrics);
}

export async function askDashboardAiAssistant(message: string): Promise<DashboardAiChatDto> {
  const question = message.trim().slice(0, 500);
  if (!question) return { reply: "Escribí una pregunta sobre la operación del día para poder ayudarte." };

  const metrics = await getInsightMetrics();
  if (!hasEnoughData(metrics)) return { reply: INSUFFICIENT_INSIGHT };

  const kimiReply = await getKimiChatReply(question, metrics).catch(() => null);
  return { reply: kimiReply ?? buildDeterministicChatReply(question, metrics) };
}

async function getInsightMetrics(): Promise<InsightMetrics> {
  const supabase = createAdminClient();
  const todayStart = startOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);
  const yesterdayStart = addDays(todayStart, -1);

  const [{ data: payments, error: paymentsError }, { data: sessions, error: sessionsError }] = await Promise.all([
    supabase
      .from("payments")
      .select("amount_cents, method, status, duration_minutes, created_at, zones(name), permit_holders(display_name)")
      .gte("created_at", yesterdayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString()),
    supabase
      .from("parking_sessions")
      .select("status, created_at")
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString()),
  ]);

  if (paymentsError) throw new Error(paymentsError.message);
  if (sessionsError) throw new Error(sessionsError.message);

  const rows = (payments ?? []) as unknown as InsightPaymentRow[];
  const todayConfirmed = rows.filter((payment) => payment.status === "confirmed" && isInRange(payment.created_at, todayStart, tomorrowStart));
  const yesterdayConfirmed = rows.filter((payment) => payment.status === "confirmed" && isInRange(payment.created_at, yesterdayStart, todayStart));
  const sessionsToday = ((sessions ?? []) as InsightSessionRow[]).reduce(
    (accumulator, session) => {
      if (session.status === "active") accumulator.active += 1;
      if (session.status === "closed") accumulator.closed += 1;
      return accumulator;
    },
    { active: 0, closed: 0 },
  );

  return {
    today: {
      revenueCents: sumRevenue(todayConfirmed),
      confirmedPayments: todayConfirmed.length,
      digitalPayments: todayConfirmed.filter((payment) => payment.method === "digital").length,
      cashPayments: todayConfirmed.filter((payment) => payment.method === "cash").length,
      averageDurationMinutes: average(todayConfirmed.map((payment) => payment.duration_minutes).filter((value) => value > 0)),
    },
    yesterday: {
      revenueCents: sumRevenue(yesterdayConfirmed),
      confirmedPayments: yesterdayConfirmed.length,
    },
    paymentMethods: {
      cash: summarizeMethod(todayConfirmed, "cash"),
      digital: summarizeMethod(todayConfirmed, "digital"),
    },
    timeBands: summarizeTimeBands(todayConfirmed),
    topZone: topByName(todayConfirmed, (payment) => payment.zones?.name ?? "Sin zona"),
    topPermitHolder: topByName(todayConfirmed, (payment) => payment.permit_holders?.display_name ?? "Sin permisionario"),
    sessionsToday,
  };
}

async function getKimiInsights(metrics: InsightMetrics): Promise<DashboardAiInsightsDto | null> {
  const config = getKimiConfig();
  if (!config) return null;

  const system = "Sos un asistente institucional para un dashboard municipal de estacionamiento medido. Respondé solo con el objeto solicitado. No inventes datos. No menciones JSON, base de datos, endpoints ni cálculos internos. Usá español claro, tono institucional y hasta tres frases breves.";
  const user = `Generá una lectura operativa breve con estos datos agregados del día. Priorizá comparaciones simples: hoy contra ayer, digital contra efectivo, franja horaria, zona o permisionario con más actividad. Si los datos no alcanzan, devolvé una única frase de datos insuficientes. Datos: ${JSON.stringify(metrics)}`;

  if (config.protocol === "anthropic") {
    const content = await getKimiAnthropicText(config, system, `${user}\n\nDevolvé únicamente un objeto JSON válido con esta forma exacta: {"title":"${TITLE}","insights":["frase breve"]}.`, 260);
    if (!content) return null;
    return normalizeInsights(parseJsonObject(content));
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      max_completion_tokens: 260,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dashboard_ai_insights",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["title", "insights"],
            properties: {
              title: { type: "string", const: TITLE },
              insights: { type: "array", minItems: 1, maxItems: MAX_INSIGHTS, items: { type: "string" } },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const completion = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = completion.choices?.[0]?.message?.content;
  if (!content) return null;

  return normalizeInsights(JSON.parse(content));
}

async function getKimiChatReply(question: string, metrics: InsightMetrics): Promise<string | null> {
  const config = getKimiConfig();
  if (!config) return null;

  const system = "Sos el asistente operativo de SEM Digital para usuarios municipales. Respondé en español claro, institucional y breve. Usá únicamente los datos agregados provistos. No inventes datos, no hagas predicciones avanzadas, no menciones JSON, base de datos, endpoints, API ni cálculos internos. Si la pregunta no trata sobre métricas operativas del estacionamiento medido, explicá que solo podés ayudar con recaudación, pagos, zonas, permisionarios, horarios y sesiones.";
  const user = `Pregunta municipal: ${question}\n\nDatos agregados disponibles: ${JSON.stringify(metrics)}\n\nRespondé con un informe o respuesta breve. Si corresponde, usá hasta 4 puntos simples.`;

  if (config.protocol === "anthropic") {
    const content = await getKimiAnthropicText(config, system, `${user}\n\nDevolvé únicamente un objeto JSON válido con esta forma exacta: {"reply":"respuesta breve"}.`, 420);
    if (!content) return null;
    const parsed = parseJsonObject(content) as { reply?: unknown } | null;
    return normalizeChatReply(parsed?.reply);
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      max_completion_tokens: 420,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dashboard_ai_chat",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["reply"],
            properties: {
              reply: { type: "string" },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const completion = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = completion.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content) as { reply?: unknown };
  return normalizeChatReply(parsed.reply);
}

async function getKimiAnthropicText(config: KimiConfig, system: string, user: string, maxTokens: number) {
  const response = await fetch(`${trimTrailingSlash(config.baseUrl)}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) return null;

  const completion = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
  return completion.content?.find((block) => block.type === "text")?.text ?? null;
}

function getKimiConfig(): KimiConfig | null {
  const apiKey = process.env.KIMI_API_KEY ?? process.env.MOONSHOT_API_KEY;
  if (!apiKey) return null;

  const isKimiCodeKey = apiKey.startsWith("sk-kimi-");
  return {
    apiKey,
    baseUrl: process.env.KIMI_API_BASE_URL ?? (isKimiCodeKey ? KIMI_CODE_BASE_URL : DEFAULT_KIMI_BASE_URL),
    model: process.env.KIMI_MODEL ?? (isKimiCodeKey ? KIMI_CODE_MODEL : DEFAULT_KIMI_MODEL),
    protocol: isKimiCodeKey ? "anthropic" : "openai",
  };
}

function buildDeterministicInsights(metrics: InsightMetrics): DashboardAiInsightsDto {
  const insights: string[] = [];
  const revenueChange = percentChange(metrics.today.revenueCents, metrics.yesterday.revenueCents);

  if (revenueChange !== null) {
    const verb = revenueChange > 0 ? "aumentó" : revenueChange < 0 ? "disminuyó" : "se mantuvo estable";
    const magnitude = revenueChange === 0 ? "" : ` un ${Math.abs(revenueChange)}%`;
    insights.push(`La recaudación de hoy ${verb}${magnitude} respecto de ayer.`);
  }

  const topMethod = getTopPaymentMethod(metrics);
  if (topMethod) insights.push(`El medio de pago más utilizado fue ${topMethod}.`);

  if (metrics.topZone && metrics.topZone.name !== "Sin zona") {
    insights.push(`La mayor actividad se concentró en la zona ${metrics.topZone.name}.`);
  }

  if (insights.length < MAX_INSIGHTS) {
    const topBand = getTopTimeBand(metrics);
    if (topBand) insights.push(`Se observa una mayor actividad durante ${topBand}.`);
  }

  if (insights.length < MAX_INSIGHTS && metrics.today.averageDurationMinutes) {
    insights.push(`La permanencia promedio fue de ${formatDuration(metrics.today.averageDurationMinutes)}.`);
  }

  return insights.length === 0 ? insufficientInsights() : { title: TITLE, insights: insights.slice(0, MAX_INSIGHTS) };
}

function buildDeterministicChatReply(question: string, metrics: InsightMetrics) {
  const normalized = question.toLowerCase();

  if (normalized.includes("zona")) {
    if (!metrics.topZone || metrics.topZone.name === "Sin zona") return "No hay información suficiente por zona para responder con confianza.";
    return `La zona con mayor actividad es ${metrics.topZone.name}, con ${metrics.topZone.count} operaciones confirmadas durante la jornada.`;
  }

  if (normalized.includes("permisionario")) {
    if (!metrics.topPermitHolder || metrics.topPermitHolder.name === "Sin permisionario") return "No hay información suficiente por permisionario para responder con confianza.";
    return `El permisionario con más operaciones es ${metrics.topPermitHolder.name}, con ${metrics.topPermitHolder.count} cobros confirmados hoy.`;
  }

  if (normalized.includes("medio") || normalized.includes("mercado") || normalized.includes("efectivo") || normalized.includes("pago")) {
    const topMethod = getTopPaymentMethod(metrics);
    if (!topMethod) return "Todavía no hay pagos confirmados suficientes para comparar medios de pago.";
    return `El medio de pago más utilizado hoy fue ${topMethod}. Se registraron ${metrics.paymentMethods.digital.count} pagos por Mercado Pago y ${metrics.paymentMethods.cash.count} pagos en efectivo.`;
  }

  if (normalized.includes("hora") || normalized.includes("horario") || normalized.includes("mañana") || normalized.includes("tarde") || normalized.includes("noche")) {
    const topBand = getTopTimeBand(metrics);
    return topBand ? `La mayor actividad se concentró durante ${topBand}.` : "No hay una franja horaria claramente predominante con los datos actuales.";
  }

  if (normalized.includes("ayer") || normalized.includes("compar")) {
    const change = percentChange(metrics.today.revenueCents, metrics.yesterday.revenueCents);
    if (change === null) return "No hay datos suficientes de ayer para comparar la recaudación con confianza.";
    const verb = change > 0 ? "aumentó" : change < 0 ? "disminuyó" : "se mantuvo estable";
    const magnitude = change === 0 ? "" : ` un ${Math.abs(change)}%`;
    return `La recaudación de hoy ${verb}${magnitude} respecto de ayer.`;
  }

  const dailyInsights = buildDeterministicInsights(metrics).insights;
  return [`Informe breve del día:`, ...dailyInsights].join("\n");
}

function normalizeInsights(value: unknown): DashboardAiInsightsDto | null {
  if (!value || typeof value !== "object") return null;
  const insights = (value as { insights?: unknown }).insights;
  if (!Array.isArray(insights)) return null;

  const safeInsights = insights
    .filter((insight): insight is string => typeof insight === "string")
    .map((insight) => insight.trim())
    .filter((insight) => insight.length > 0 && !containsTechnicalLanguage(insight))
    .slice(0, MAX_INSIGHTS);

  return safeInsights.length === 0 ? null : { title: TITLE, insights: safeInsights };
}

function normalizeChatReply(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const reply = value.trim().slice(0, MAX_CHAT_CHARS);
  if (!reply || containsTechnicalLanguage(reply)) return null;
  return reply;
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return JSON.parse(trimmed.slice(start, end + 1));
}

function hasEnoughData(metrics: InsightMetrics) {
  return metrics.today.confirmedPayments > 0 || metrics.sessionsToday.active > 0 || metrics.sessionsToday.closed > 0;
}

function insufficientInsights(): DashboardAiInsightsDto {
  return { title: TITLE, insights: [INSUFFICIENT_INSIGHT] };
}

function summarizeMethod(rows: InsightPaymentRow[], method: PaymentMethod) {
  const matching = rows.filter((payment) => payment.method === method);
  return { count: matching.length, revenueCents: sumRevenue(matching) };
}

function summarizeTimeBands(rows: InsightPaymentRow[]): InsightMetrics["timeBands"] {
  const bands: InsightMetrics["timeBands"] = {
    morning: { label: "la mañana", count: 0, revenueCents: 0 },
    afternoon: { label: "la tarde", count: 0, revenueCents: 0 },
    night: { label: "la noche", count: 0, revenueCents: 0 },
  };

  for (const payment of rows) {
    const hour = new Date(payment.created_at).getHours();
    const band = hour >= 6 && hour < 13 ? "morning" : hour >= 13 && hour < 20 ? "afternoon" : "night";
    bands[band].count += 1;
    bands[band].revenueCents += payment.amount_cents;
  }

  return bands;
}

function topByName(rows: InsightPaymentRow[], getName: (payment: InsightPaymentRow) => string): CountedValue | null {
  const values = new Map<string, CountedValue>();
  for (const payment of rows) {
    const name = getName(payment);
    const current = values.get(name) ?? { name, count: 0, revenueCents: 0 };
    current.count += 1;
    current.revenueCents += payment.amount_cents;
    values.set(name, current);
  }

  return Array.from(values.values()).sort((left, right) => right.count - left.count || right.revenueCents - left.revenueCents)[0] ?? null;
}

function getTopPaymentMethod(metrics: InsightMetrics) {
  const { cash, digital } = metrics.paymentMethods;
  if (cash.count === 0 && digital.count === 0) return null;
  if (digital.count === cash.count) return digital.revenueCents >= cash.revenueCents ? "Mercado Pago" : "efectivo";
  return digital.count > cash.count ? "Mercado Pago" : "efectivo";
}

function getTopTimeBand(metrics: InsightMetrics) {
  const bands = Object.values(metrics.timeBands).sort((left, right) => right.count - left.count || right.revenueCents - left.revenueCents);
  const [first, second] = bands;
  if (!first || first.count === 0 || (second && first.count === second.count)) return null;
  return first.label;
}

function sumRevenue(rows: Array<{ amount_cents: number }>) {
  return rows.reduce((sum, row) => sum + row.amount_cents, 0);
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours.toLocaleString("es-AR")} horas`;
}

function containsTechnicalLanguage(value: string) {
  return /json|base de datos|endpoint|api|sql|query|cálculo interno|calculo interno/i.test(value);
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isInRange(value: string, from: Date, to: Date) {
  const date = new Date(value);
  return date >= from && date < to;
}
