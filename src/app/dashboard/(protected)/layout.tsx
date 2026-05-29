import { LogOut } from "lucide-react";
import { DashboardShell } from "@/app/dashboard/(protected)/DashboardShell";
import { requireDashboardPageUser } from "@/server/dashboard/auth";
import { signOutDashboard } from "@/app/dashboard/actions";
import { Button } from "@/components/Button";

export const dynamic = "force-dynamic";

export default async function DashboardProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireDashboardPageUser();
  return (
    <DashboardShell
      signOutSlot={
        <form action={signOutDashboard} className="space-y-3">
          <span className="text-sm font-semibold text-ink-soft">{user.displayName}</span>
          <Button type="submit" variant="secondary" className="min-h-11 w-full px-4 text-sm" leftIcon={<LogOut className="size-4" />}>Salir</Button>
        </form>
      }
    >
      {children}
    </DashboardShell>
  );
}
