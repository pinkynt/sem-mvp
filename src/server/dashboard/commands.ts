import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
import { DashboardValidationError } from "@/server/dashboard/auth";
import { hashPermitHolderPassword } from "@/server/dashboard/passwords";

export const permitHolderSchema = z.object({ id: z.string().uuid().optional(), displayName: z.string().min(2), fileNumber: z.string().min(2), zoneId: z.string().uuid(), active: z.boolean().default(true), username: z.string().min(3).optional().or(z.literal("")), password: z.string().optional().or(z.literal("")), accountActive: z.boolean().default(true) });
export const tariffSchema = z.object({ zoneId: z.string().uuid(), vehicleKind: z.enum(["auto", "moto"]), label: z.string().min(2), hourlyRateCents: z.coerce.number().int().positive(), digitalDiscountPercent: z.coerce.number().int().min(0).max(100) });

export async function upsertPermitHolder(input: z.infer<typeof permitHolderSchema>, dashboardUserId: string) {
  const parsed = permitHolderSchema.parse(input);
  const supabase = createAdminClient();
  const payload = { display_name: parsed.displayName, file_number: parsed.fileNumber, zone_id: parsed.zoneId, active: parsed.active };
  const { data: holder, error } = parsed.id
    ? await supabase.from("permit_holders").update(payload).eq("id", parsed.id).select("id").single()
    : await supabase.from("permit_holders").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  const permitHolderId = (holder as { id: string }).id;
  if (parsed.username) await upsertPermitHolderAccount({ permitHolderId, username: parsed.username, password: parsed.password, active: parsed.accountActive, dashboardUserId });
  return { id: permitHolderId };
}

export async function upsertPermitHolderAccount(input: { permitHolderId: string; username: string; password?: string; active: boolean; dashboardUserId: string }) {
  const supabase = createAdminClient();
  const username = input.username.trim();
  const { data: existing, error: existingError } = await supabase.from("permit_holder_accounts").select("permit_holder_id").eq("username", username).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing && (existing as { permit_holder_id: string }).permit_holder_id !== input.permitHolderId) throw new DashboardValidationError("Ese usuario ya existe. Elegí otro nombre para la cuenta futura.", "username", "duplicate_username");
  const base = { permit_holder_id: input.permitHolderId, username, active: input.active, created_by: input.dashboardUserId };
  const payload = input.password ? { ...base, password_hash: await hashPermitHolderPassword(input.password), password_updated_at: new Date().toISOString() } : base;
  const { error } = await supabase.from("permit_holder_accounts").upsert(payload, { onConflict: "permit_holder_id" });
  if (error) {
    if (error.code === "23505") throw new DashboardValidationError("Ese usuario ya existe. Elegí otro nombre para la cuenta futura.", "username", "duplicate_username");
    throw new Error(error.message);
  }
}

export async function setPermitHolderActive(id: string, active: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("permit_holders").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createTariff(input: z.infer<typeof tariffSchema>) {
  const parsed = tariffSchema.parse(input);
  const supabase = createAdminClient();
  const { error: deactivateError } = await supabase.from("tariffs").update({ active: false }).eq("zone_id", parsed.zoneId).eq("vehicle_kind", parsed.vehicleKind).eq("active", true);
  if (deactivateError) throw new Error(deactivateError.message);
  const { data, error } = await supabase.from("tariffs").insert({ zone_id: parsed.zoneId, vehicle_kind: parsed.vehicleKind, label: parsed.label, hourly_rate_cents: parsed.hourlyRateCents, digital_discount_percent: parsed.digitalDiscountPercent, active: true }).select("id").single();
  if (error) throw new Error(error.message);
  return data as { id: string };
}
