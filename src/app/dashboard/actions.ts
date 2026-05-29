"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { requireDashboardUser } from "@/server/dashboard/auth";
import { setPermitHolderActive, upsertPermitHolder } from "@/server/dashboard/commands";

export async function signInDashboard(_previous: { error?: string }, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = safeDashboardRedirect(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "No pudimos iniciar sesión con esas credenciales." };
  redirect(nextPath);
}

export async function signOutDashboard() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/dashboard/login");
}

export async function savePermitHolder(formData: FormData) {
  const user = await requireDashboardUser();
  await upsertPermitHolder({
    id: value(formData, "id") || undefined,
    displayName: value(formData, "displayName"),
    fileNumber: value(formData, "fileNumber"),
    zoneId: value(formData, "zoneId"),
    active: value(formData, "active") !== "false",
    username: value(formData, "username"),
    password: value(formData, "password"),
    accountActive: value(formData, "accountActive") !== "false",
  }, user.id);
  revalidatePath("/dashboard/permisionarios");
}

export async function togglePermitHolder(formData: FormData) {
  await requireDashboardUser();
  await setPermitHolderActive(value(formData, "id"), value(formData, "active") === "true");
  revalidatePath("/dashboard/permisionarios");
}

function value(formData: FormData, key: string) { return String(formData.get(key) ?? ""); }

function safeDashboardRedirect(value: string) {
  if (!value.startsWith("/dashboard") || value.startsWith("/dashboard/login")) return "/dashboard";
  return value;
}
