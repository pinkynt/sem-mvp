import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
import { DashboardValidationError } from "@/server/dashboard/auth";
import { hashPermitHolderPassword } from "@/server/dashboard/passwords";

const optionalTrimmedString = (minLength: number, message: string) => z.preprocess((value) => typeof value === "string" ? value.trim() : value, z.string().min(minLength, message).optional().or(z.literal("")));
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const permitHolderSchema = z.object({
  id: z.string().uuid().optional(),
  displayName: z.string().trim().min(2, "Ingresá un nombre de al menos 2 caracteres."),
  fileNumber: z.string().trim().min(1, "Ingresá el legajo."),
  zoneId: z.string().trim().optional().or(z.literal("")),
  active: z.boolean().default(true),
  username: optionalTrimmedString(3, "Ingresá un usuario de al menos 3 caracteres."),
  password: z.string().optional().or(z.literal("")),
  accountActive: z.boolean().default(true),
});
export const tariffSchema = z.object({
  zoneId: z.string().trim().optional().or(z.literal("")),
  vehicleKind: z.enum(["auto", "moto"], "Seleccioná un tipo de vehículo válido."),
  label: z.string().trim().min(2, "Ingresá una etiqueta de al menos 2 caracteres."),
  hourlyRateCents: z.coerce.number().int().positive("Ingresá un valor por hora válido."),
  digitalDiscountPercent: z.coerce.number().int().min(0, "El descuento no puede ser negativo.").max(100, "El descuento no puede superar el 100%."),
});
export const zoneSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Ingresá un nombre de zona de al menos 2 caracteres."),
  active: z.boolean().default(true),
});

export async function upsertPermitHolder(input: z.infer<typeof permitHolderSchema>, dashboardUserId: string) {
  const parsed = permitHolderSchema.parse(input);
  if (!parsed.id && parsed.username && !parsed.password) throw new DashboardValidationError("Ingresá una contraseña de acceso para el permisionario.", "password", "missing_password");
  const supabase = createAdminClient();
  const zoneId = await resolveZoneId(supabase, parsed.zoneId);
  const payload = { display_name: parsed.displayName, file_number: parsed.fileNumber, zone_id: zoneId, active: parsed.active };
  const { data: holder, error } = parsed.id
    ? await supabase.from("permit_holders").update(payload).eq("id", parsed.id).select("id").single()
    : await supabase.from("permit_holders").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  const permitHolderId = (holder as { id: string }).id;
  if (parsed.username) await upsertPermitHolderAccount({ permitHolderId, username: parsed.username, password: parsed.password, active: parsed.accountActive, dashboardUserId });
  return { id: permitHolderId };
}

async function resolveZoneId(supabase: ReturnType<typeof createAdminClient>, input: string | undefined) {
  const value = input?.trim() ?? "";
  if (uuidPattern.test(value)) return value;

  const { data, error } = await supabase.from("zones").select("id, name").eq("active", true).order("name");
  if (error) throw new Error(error.message);
  const zones = (data ?? []) as Array<{ id: string; name: string }>;
  const matchingZone = zones.find((zone) => zone.name.toLowerCase() === value.toLowerCase());
  if (matchingZone) return matchingZone.id;
  if (zones.length === 1) return zones[0].id;

  throw new DashboardValidationError("Seleccioná una zona válida.", "zoneId", "invalid_zone");
}

export async function upsertPermitHolderAccount(input: { permitHolderId: string; username: string; password?: string; active: boolean; dashboardUserId: string }) {
  const supabase = createAdminClient();
  const username = input.username.trim();
  const { data: existing, error: existingError } = await supabase.from("permit_holder_accounts").select("permit_holder_id").eq("username", username).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing && (existing as { permit_holder_id: string }).permit_holder_id !== input.permitHolderId) throw new DashboardValidationError("Ese usuario de acceso ya existe. Elegí otro.", "username", "duplicate_username");
  if (!existing && !input.password) throw new DashboardValidationError("Ingresá una contraseña de acceso para el permisionario.", "password", "missing_password");
  const base = { permit_holder_id: input.permitHolderId, username, active: input.active, created_by: input.dashboardUserId };
  const payload = input.password ? { ...base, password_hash: await hashPermitHolderPassword(input.password), password_updated_at: new Date().toISOString() } : base;
  const { error } = await supabase.from("permit_holder_accounts").upsert(payload, { onConflict: "permit_holder_id" });
  if (error) {
    if (error.code === "23505") throw new DashboardValidationError("Ese usuario de acceso ya existe. Elegí otro.", "username", "duplicate_username");
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
  const zoneId = await resolveZoneId(supabase, parsed.zoneId);
  const { error: deactivateError } = await supabase.from("tariffs").update({ active: false }).eq("zone_id", zoneId).eq("vehicle_kind", parsed.vehicleKind).eq("active", true);
  if (deactivateError) throw new Error(deactivateError.message);
  const { data, error } = await supabase.from("tariffs").insert({ zone_id: zoneId, vehicle_kind: parsed.vehicleKind, label: parsed.label, hourly_rate_cents: parsed.hourlyRateCents, digital_discount_percent: parsed.digitalDiscountPercent, active: true }).select("id").single();
  if (error) throw new Error(error.message);
  return data as { id: string };
}

export async function upsertZone(input: z.infer<typeof zoneSchema>) {
  const parsed = zoneSchema.parse(input);
  const supabase = createAdminClient();
  const payload = { name: parsed.name, active: parsed.active };
  const { data, error } = parsed.id
    ? await supabase.from("zones").update(payload).eq("id", parsed.id).select("id").single()
    : await supabase.from("zones").insert(payload).select("id").single();
  if (error) {
    if (error.code === "23505") throw new DashboardValidationError("Ya existe una zona con ese nombre.", "name", "duplicate_zone");
    throw new Error(error.message);
  }
  return data as { id: string };
}

export async function deleteZone(id: string) {
  if (!uuidPattern.test(id)) throw new DashboardValidationError("Seleccioná una zona válida.", "id", "invalid_zone");
  const supabase = createAdminClient();
  const { error } = await supabase.from("zones").update({ active: false }).eq("id", id);
  if (error) throw new Error(error.message);
}
