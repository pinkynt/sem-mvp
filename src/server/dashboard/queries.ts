import { createAdminClient } from "@/utils/supabase/admin";
import type { DashboardKpisDto, LatestMovementDto, OperationDetailDto, OperationFilters, OperationListDto, OperationRowDto, PaymentMethod, PaymentStatus, PermitHolderAdminDto, RevenuePointDto, TariffDto, VehicleKind, ZoneAdminDto, ZoneDto } from "@/contracts/dashboard";
import { normalizeOperationDateFilter } from "@/lib/operation-date-filters";

type PaymentRow = {
  id: string; zone_id: string; permit_holder_id: string; parking_session_id: string | null; license_plate: string; vehicle_kind: VehicleKind; method: PaymentMethod; status: PaymentStatus; amount_cents: number; base_amount_cents: number; discount_cents: number; duration_minutes: number; valid_until: string | null; confirmed_at: string | null; created_at: string;
  zones: { id: string; name: string } | null;
  permit_holders: { id: string; display_name: string; file_number: string } | null;
  parking_sessions?: { id: string; status: "active" | "closed"; started_at: string; closed_at: string | null } | null;
  payment_gateway_refs?: Array<{ provider: string; provider_order_id: string | null; provider_payment_id: string | null; external_reference: string }> | null;
};

type PermitHolderRow = { id: string; zone_id: string; display_name: string; file_number: string; active: boolean; created_at: string; zones: { id: string; name: string } | null; permit_holder_accounts: Array<{ id: string; username: string; active: boolean; password_updated_at: string }> | null };
type TariffRow = { id: string; zone_id: string; vehicle_kind: VehicleKind; label: string; hourly_rate_cents: number; digital_discount_percent: number; active: boolean; created_at: string; zones: { id: string; name: string } | null };
type ZoneAdminRow = { id: string; name: string; active: boolean; created_at: string; permit_holders: Array<{ id: string; zone_id: string; display_name: string; file_number: string; active: boolean; created_at: string; permit_holder_accounts: Array<{ id: string; username: string; active: boolean; password_updated_at: string }> | null }> | null };
type OperationFilterQuery = {
  gte(column: string, value: string): OperationFilterQuery;
  lte(column: string, value: string): OperationFilterQuery;
  eq(column: string, value: string): OperationFilterQuery;
  ilike(column: string, value: string): OperationFilterQuery;
};

export async function getDashboardKpis(): Promise<DashboardKpisDto> {
  const supabase = createAdminClient();
  const today = startOfToday();
  const [{ data: payments, error: paymentsError }, activeSessions, permitHolders] = await Promise.all([
    supabase.from("payments").select("amount_cents, method, status, confirmed_at, created_at").gte("created_at", today),
    countRows("parking_sessions", "status", "active"),
    countRows("permit_holders", "active", true),
  ]);
  if (paymentsError) throw new Error(paymentsError.message);

  const rows = (payments ?? []) as Array<{ amount_cents: number; method: PaymentMethod; status: PaymentStatus }>;
  const confirmed = rows.filter((payment) => payment.status === "confirmed");
  const digital = confirmed.filter((payment) => payment.method === "digital");
  return {
    todayRevenueCents: confirmed.reduce((sum, payment) => sum + payment.amount_cents, 0),
    todayPayments: confirmed.length,
    activeSessions,
    permitHolders,
    pendingPayments: rows.filter((payment) => payment.status === "pending").length,
    digitalSharePercent: confirmed.length === 0 ? 0 : Math.round((digital.length / confirmed.length) * 100),
  };
}

export async function getRevenueChart(days = 7): Promise<RevenuePointDto[]> {
  const supabase = createAdminClient();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("payments")
    .select("amount_cents, method, status, created_at")
    .gte("created_at", from.toISOString())
    .eq("status", "confirmed")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const points = new Map<string, RevenuePointDto>();
  for (let index = 0; index < days; index += 1) {
    const date = new Date(from);
    date.setDate(from.getDate() + index);
    points.set(date.toISOString().slice(0, 10), { date: date.toISOString().slice(0, 10), cashCents: 0, digitalCents: 0, confirmedCount: 0 });
  }
  for (const payment of (data ?? []) as Array<{ amount_cents: number; method: PaymentMethod; created_at: string }>) {
    const key = payment.created_at.slice(0, 10);
    const point = points.get(key);
    if (!point) continue;
    if (payment.method === "cash") point.cashCents += payment.amount_cents;
    else point.digitalCents += payment.amount_cents;
    point.confirmedCount += 1;
  }
  return Array.from(points.values());
}

export async function getLatestMovements(limit = 5): Promise<LatestMovementDto[]> {
  const { rows } = await getOperations({ page: 1, pageSize: limit });
  return rows.map((row) => ({ id: row.id, type: "payment", title: `${row.licensePlate} · ${formatMethod(row.method)}`, detail: `${row.permitHolderName} · ${row.zoneName}`, amountCents: row.amountCents, status: row.status, createdAt: row.createdAt }));
}

export async function getOperations(filters: OperationFilters = {}): Promise<OperationListDto> {
  const supabase = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const fromIndex = (page - 1) * pageSize;
  let query = supabase
    .from("payments")
    .select("*, zones(id, name), permit_holders(id, display_name, file_number)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(fromIndex, fromIndex + pageSize - 1);
  query = applyOperationFilters(query, filters);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: ((data ?? []) as unknown as PaymentRow[]).map(mapOperation), total: count ?? 0, page, pageSize };
}

export async function getOperation(id: string): Promise<OperationDetailDto> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, zones(id, name), permit_holders(id, display_name, file_number), parking_sessions(id, status, started_at, closed_at), payment_gateway_refs(provider, provider_order_id, provider_payment_id, external_reference)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  const row = data as unknown as PaymentRow;
  return {
    ...mapOperation(row),
    vehicleKind: row.vehicle_kind,
    baseAmountCents: row.base_amount_cents,
    discountCents: row.discount_cents,
    validUntil: row.valid_until,
    session: row.parking_sessions ? { id: row.parking_sessions.id, status: row.parking_sessions.status, startedAt: row.parking_sessions.started_at, closedAt: row.parking_sessions.closed_at } : null,
    gateway: row.payment_gateway_refs?.[0] ? { provider: row.payment_gateway_refs[0].provider, providerOrderId: row.payment_gateway_refs[0].provider_order_id, providerPaymentId: row.payment_gateway_refs[0].provider_payment_id, externalReference: row.payment_gateway_refs[0].external_reference } : null,
  };
}

export async function getPermitHolders(): Promise<PermitHolderAdminDto[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("permit_holders")
    .select("id, zone_id, display_name, file_number, active, created_at, zones(id, name), permit_holder_accounts(id, username, active, password_updated_at)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as PermitHolderRow[]).map(mapPermitHolder);
}

export async function getTariffs(): Promise<TariffDto[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tariffs")
    .select("id, zone_id, vehicle_kind, label, hourly_rate_cents, digital_discount_percent, active, created_at, zones(id, name)")
    .order("active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as TariffRow[]).map(mapTariff);
}

export async function getZones(): Promise<ZoneDto[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("zones").select("id, name, active").eq("active", true).order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as ZoneDto[];
}

export async function getAdminZones(): Promise<ZoneAdminDto[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("zones")
    .select("id, name, active, created_at, permit_holders(id, zone_id, display_name, file_number, active, created_at, permit_holder_accounts(id, username, active, password_updated_at))")
    .order("active", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ZoneAdminRow[]).map(mapAdminZone);
}

export async function getExportOperations(filters: OperationFilters = {}) {
  return getOperations({ ...filters, page: 1, pageSize: 1000 });
}

function applyOperationFilters<TQuery extends OperationFilterQuery>(query: TQuery, filters: OperationFilters): TQuery {
  let next = query;
  const from = normalizeOperationDateFilter(filters.from, "start");
  const to = normalizeOperationDateFilter(filters.to, "end");
  if (from) next = next.gte("created_at", from) as TQuery;
  if (to) next = next.lte("created_at", to) as TQuery;
  if (filters.status && filters.status !== "all") next = next.eq("status", filters.status) as TQuery;
  if (filters.method && filters.method !== "all") next = next.eq("method", filters.method) as TQuery;
  if (filters.zoneId) next = next.eq("zone_id", filters.zoneId) as TQuery;
  if (filters.permitHolderId) next = next.eq("permit_holder_id", filters.permitHolderId) as TQuery;
  if (filters.plate) next = next.ilike("license_plate", `%${filters.plate.toUpperCase()}%`) as TQuery;
  return next;
}

async function countRows(table: "parking_sessions" | "permit_holders", column: string, value: string | boolean) {
  const supabase = createAdminClient();
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).eq(column, value);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function mapOperation(row: PaymentRow): OperationRowDto {
  return { id: row.id, licensePlate: row.license_plate, zoneId: row.zone_id, zoneName: row.zones?.name ?? "Sin zona", permitHolderName: row.permit_holders?.display_name ?? "Sin permisionario", permitHolderFileNumber: row.permit_holders?.file_number ?? "—", method: row.method, status: row.status, amountCents: row.amount_cents, durationMinutes: row.duration_minutes, createdAt: row.created_at, confirmedAt: row.confirmed_at };
}

function mapPermitHolder(row: PermitHolderRow): PermitHolderAdminDto {
  const account = row.permit_holder_accounts?.[0] ?? null;
  return { id: row.id, displayName: row.display_name, fileNumber: row.file_number, zoneId: row.zone_id, zoneName: row.zones?.name ?? "Sin zona", active: row.active, createdAt: row.created_at, account: account ? { id: account.id, username: account.username, active: account.active, passwordUpdatedAt: account.password_updated_at } : null };
}

function mapTariff(row: TariffRow): TariffDto {
  return { id: row.id, zoneId: row.zone_id, zoneName: row.zones?.name ?? "Sin zona", vehicleKind: row.vehicle_kind, label: row.label, hourlyRateCents: row.hourly_rate_cents, digitalDiscountPercent: row.digital_discount_percent, active: row.active, createdAt: row.created_at };
}

function mapAdminZone(row: ZoneAdminRow): ZoneAdminDto {
  const permitHolders = (row.permit_holders ?? []).map((holder) => mapPermitHolder({ ...holder, zones: { id: row.id, name: row.name } }));
  return { id: row.id, name: row.name, active: row.active, createdAt: row.created_at, permitHolders, permitHolderCount: permitHolders.length, activePermitHolderCount: permitHolders.filter((holder) => holder.active).length };
}

function startOfToday() { const date = new Date(); date.setHours(0, 0, 0, 0); return date.toISOString(); }
function formatMethod(method: PaymentMethod) { return method === "cash" ? "Efectivo" : "Mercado Pago"; }
