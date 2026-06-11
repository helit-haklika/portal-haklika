import { cache } from "react";
import { selectOne, selectMany } from "./client";
import type {
  Customer,
  PunchCardPayment,
  Booking,
  ActiveSession,
  SessionTransaction,
  SessionPayment,
} from "@/types";

// The portal's session.customerId is the legacy Airtable record id (rec...).
// Supabase rows preserve this in the airtable_id column.
function assertAirtableId(id: string): string {
  if (!/^rec[A-Za-z0-9]{14,17}$/.test(id)) {
    throw new Error("Invalid Airtable record id");
  }
  return id;
}

function formatCurrency(amount?: number | null): string {
  if (!amount) return "₪0";
  return `₪${amount.toLocaleString("he-IL")}`;
}

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
}

const DAYS_HE: Record<number, string> = {
  0: "ראשון",
  1: "שני",
  2: "שלישי",
  3: "רביעי",
  4: "חמישי",
  5: "שישי",
  6: "שבת",
};

function getDayOfWeek(isoDate?: string | null): string {
  if (!isoDate) return "";
  return DAYS_HE[new Date(isoDate).getDay()] ?? "";
}

const TIME_IL_FORMATTER = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatIsraelTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return TIME_IL_FORMATTER.format(d);
}

// ===== Single shared dashboard lookup (deduped per request) =====
// Pulls the customer card + computed balance in ONE query via customer_dashboard view.
// React's cache() dedupes this within a single server render — even if 6 child
// queries each call it, only one round-trip happens.
interface DashboardRow {
  id: string;
  airtable_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  email_secondary: string | null;
  status: string | null;
  legacy_credit_2024: number | null;
  details_update_status: string | null;
  balance_hours: number | null;
}

export const getDashboardRow = cache(
  async (airtableId: string): Promise<DashboardRow | null> => {
    return selectOne<DashboardRow>(
      "customer_dashboard",
      `select=*&airtable_id=eq.${encodeURIComponent(airtableId)}`,
    );
  },
);

// ===== Customer =====
export async function fetchCustomer(
  customerId: string,
  _supabaseId?: string,
): Promise<Customer | null> {
  // supabaseId is unused here - the dashboard view query needs to run regardless
  // (we need balance + customer fields). It IS used by child queries below.
  const safeId = assertAirtableId(customerId);
  const row = await getDashboardRow(safeId);
  if (!row) return null;

  const fullName = [row.first_name, row.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: row.airtable_id,
    name: fullName || row.first_name || "",
    email: row.email ?? "",
    additionalEmail: row.email_secondary ?? undefined,
    balance: row.balance_hours ?? 0,
    isActive: row.status !== "לא פעיל",
    updateFormUrl: row.details_update_status ?? undefined,
  };
}

// Returns the supabase UUID for the given legacy Airtable id. If the caller
// already has the uuid (e.g. cached in the JWT) it's used directly with no
// round trip. Otherwise we resolve via the cached getDashboardRow.
async function resolveCustomerUuid(
  airtableId: string,
  cachedSupabaseId?: string,
): Promise<string | null> {
  if (cachedSupabaseId) return cachedSupabaseId;
  const row = await getDashboardRow(airtableId);
  return row?.id ?? null;
}

// ===== Punch card payments =====
interface PaymentRow {
  airtable_id: string;
  payment_date: string | null;
  hours_purchased: number | null;
  amount: number | null;
  invoice_url: string | null;
}

export async function fetchPunchCardPayments(
  customerId: string,
  supabaseId?: string,
): Promise<PunchCardPayment[]> {
  const safeId = assertAirtableId(customerId);
  const uuid = await resolveCustomerUuid(safeId, supabaseId);
  if (!uuid) return [];

  // Match Airtable behavior: include empty/null status (treats blank as paid).
  const rows = await selectMany<PaymentRow>(
    "payments",
    `select=airtable_id,payment_date,hours_purchased,amount,invoice_url&customer_id=eq.${encodeURIComponent(uuid)}&payment_type=eq.כרטיסיה&or=(status.is.null,status.neq.לא שולם)&payment_date=gte.2025-01-01&order=payment_date.desc`,
  );

  return rows.map((r) => ({
    id: r.airtable_id,
    date: formatDate(r.payment_date),
    isoDate: r.payment_date ?? "",
    dayOfWeek: getDayOfWeek(r.payment_date),
    hours: r.hours_purchased ?? 0,
    amountPaid: formatCurrency(r.amount),
    balanceAfter: 0,
    invoiceUrl: r.invoice_url ?? undefined,
  }));
}

// ===== Bookings =====
interface BookingRow {
  airtable_id: string;
  date: string | null;
  start_at: string | null;
  end_at: string | null;
  duration_hours: number | null;
  room_id: string | null;
}

interface RoomRow {
  id: string;
  name: string;
}

export async function fetchBookings(
  customerId: string,
  supabaseId?: string,
): Promise<Booking[]> {
  const safeId = assertAirtableId(customerId);
  const uuid = await resolveCustomerUuid(safeId, supabaseId);
  if (!uuid) return [];

  const rows = await selectMany<BookingRow>(
    "bookings",
    `select=airtable_id,date,start_at,end_at,duration_hours,room_id&customer_id=eq.${encodeURIComponent(uuid)}&booking_title=eq.שעתי&date=gte.2025-01-01&order=date.desc`,
  );

  const roomIds = Array.from(
    new Set(rows.map((r) => r.room_id).filter((id): id is string => !!id)),
  );
  const roomNameById = new Map<string, string>();
  if (roomIds.length) {
    const rooms = await selectMany<RoomRow>(
      "rooms",
      `select=id,name&id=in.(${roomIds.join(",")})`,
    );
    rooms.forEach((r) => roomNameById.set(r.id, r.name));
  }

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return rows.map((r) => ({
    id: r.airtable_id,
    date: formatDate(r.date),
    isoDate: r.date ?? "",
    dayOfWeek: getDayOfWeek(r.date),
    roomName: r.room_id ? (roomNameById.get(r.room_id) ?? "") : "",
    startTime: formatIsraelTime(r.start_at),
    endTime: formatIsraelTime(r.end_at),
    durationHours: r.duration_hours ?? 0,
    balanceAfter: 0,
    isCurrentMonth: (r.date ?? "").startsWith(currentYM),
  }));
}

// ===== Active sessions =====
interface SessionRow {
  airtable_id: string;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  price_before_discount: number | null;
  room_name: string | null;
}

export async function fetchActiveSessions(
  customerId: string,
  supabaseId?: string,
): Promise<ActiveSession[]> {
  const safeId = assertAirtableId(customerId);
  const uuid = await resolveCustomerUuid(safeId, supabaseId);
  if (!uuid) return [];

  const rows = await selectMany<SessionRow>(
    "sessions",
    `select=airtable_id,day_of_week,start_time,end_time,price_before_discount,room_name&customer_id=eq.${encodeURIComponent(uuid)}&status=eq.פעיל`,
  );

  return rows.map((r) => ({
    id: r.airtable_id,
    dayOfWeek: r.day_of_week ?? "",
    startTime: r.start_time ?? "",
    endTime: r.end_time ?? "",
    basePriceBeforeDiscount: formatCurrency(r.price_before_discount),
    roomName: r.room_name ?? "",
  }));
}

// ===== Session transactions =====
interface SessionTransactionRow {
  airtable_id: string;
  price_after_discount: number | null;
}

export async function fetchSessionTransactions(
  customerId: string,
  supabaseId?: string,
): Promise<SessionTransaction[]> {
  const safeId = assertAirtableId(customerId);
  const uuid = await resolveCustomerUuid(safeId, supabaseId);
  if (!uuid) return [];

  const rows = await selectMany<SessionTransactionRow>(
    "session_transactions",
    `select=airtable_id,price_after_discount&customer_id=eq.${encodeURIComponent(uuid)}&status=eq.פעיל`,
  );

  return rows.map((r) => ({
    id: r.airtable_id,
    priceAfterDiscount: r.price_after_discount ?? 0,
  }));
}

// ===== Session payments =====
export async function fetchSessionPayments(
  customerId: string,
  supabaseId?: string,
): Promise<SessionPayment[]> {
  const safeId = assertAirtableId(customerId);
  const uuid = await resolveCustomerUuid(safeId, supabaseId);
  if (!uuid) return [];

  const rows = await selectMany<PaymentRow>(
    "payments",
    `select=airtable_id,payment_date,hours_purchased,amount,invoice_url&customer_id=eq.${encodeURIComponent(uuid)}&payment_type=eq.ססיה&status=eq.שולם&payment_date=gte.2025-01-01&order=payment_date.desc`,
  );

  return rows.map((r) => ({
    id: r.airtable_id,
    date: formatDate(r.payment_date),
    dayOfWeek: getDayOfWeek(r.payment_date),
    amountPaid: formatCurrency(r.amount),
    invoiceUrl: r.invoice_url ?? undefined,
  }));
}

// ===== Email lookup (for auth/request-link) =====
export interface CustomerLookup {
  id: string; // supabase uuid
  airtable_id: string;
  name: string;
  isActive: boolean;
}

export async function findCustomerByEmail(
  email: string,
): Promise<CustomerLookup[]> {
  const normalized = email.trim().toLowerCase();
  const rows = await selectMany<{
    id: string;
    airtable_id: string;
    first_name: string | null;
    last_name: string | null;
    status: string | null;
  }>(
    "customers",
    `select=id,airtable_id,first_name,last_name,status&or=(email.eq.${encodeURIComponent(normalized)},email_secondary.eq.${encodeURIComponent(normalized)})&limit=10`,
  );

  return rows.map((r) => ({
    id: r.id,
    airtable_id: r.airtable_id,
    name:
      [r.first_name, r.last_name].filter(Boolean).join(" ").trim() ||
      r.first_name ||
      "",
    isActive: r.status !== "לא פעיל",
  }));
}
