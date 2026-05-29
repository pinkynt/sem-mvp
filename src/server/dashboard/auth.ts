import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { DashboardRole, DashboardUser } from "@/contracts/dashboard";

type ProfileRow = {
  id: string;
  email: string;
  display_name: string;
  role: DashboardRole;
  active: boolean;
};

export class DashboardAuthError extends Error {
  status = 401;
}

export class DashboardForbiddenError extends Error {
  status = 403;
}

export class DashboardValidationError extends Error {
  status = 422;
  constructor(message: string, public field?: string, public code?: string) { super(message); }
}

export async function requireDashboardUser(): Promise<DashboardUser> {
  const authClient = await createClient();
  const { data: { user }, error } = await authClient.auth.getUser();

  if (error || !user) throw new DashboardAuthError("Dashboard login required");

  const admin = createAdminClient();
  const { data, error: profileError } = await admin
    .from("user_profiles")
    .select("id, email, display_name, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!data || !(data as ProfileRow).active) {
    throw new DashboardForbiddenError("Municipal dashboard profile required");
  }

  const profile = data as ProfileRow;
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    role: profile.role,
  };
}

export async function requireDashboardPageUser() {
  try {
    return await requireDashboardUser();
  } catch (error) {
    if (error instanceof DashboardForbiddenError) redirect("/dashboard/unauthorized");
    redirect("/dashboard/login");
  }
}

export function dashboardApiError(error: unknown, fallbackMessage = "No pudimos completar la operación. Revisá los datos e intentá nuevamente.") {
  if (error instanceof DashboardAuthError) return Response.json({ error: error.message }, { status: 401 });
  if (error instanceof DashboardForbiddenError) return Response.json({ error: error.message }, { status: 403 });
  if (error instanceof DashboardValidationError) return Response.json({ error: error.message, field: error.field, code: error.code }, { status: error.status });
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = typeof issue?.path[0] === "string" ? issue.path[0] : undefined;
    return Response.json({ error: issue?.message ?? fallbackMessage, field, code: "invalid_input" }, { status: 422 });
  }
  return Response.json({ error: fallbackMessage }, { status: 400 });
}
