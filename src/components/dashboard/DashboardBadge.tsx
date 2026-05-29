import { cn } from "@/lib/cn";

const tones = {
  confirmed: "bg-confirm/20 text-confirm-ink",
  pending: "bg-warn/25 text-warn-ink",
  failed: "bg-danger/10 text-danger",
  neutral: "bg-surface-muted text-brand-strong",
  digital: "bg-brand-tint text-brand",
};

export function DashboardBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof tones }) {
  return <span className={cn("inline-flex items-center rounded-pill px-3 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}
