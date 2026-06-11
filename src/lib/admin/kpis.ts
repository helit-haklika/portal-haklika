// Server-only admin queries against Supabase, split by domain.
// Unlike src/lib/supabase/queries.ts (portal-facing, accepts legacy airtable_id),
// admin queries work directly with Supabase UUIDs and return raw rows for tables.

import "server-only";
import { selectMany } from "@/lib/supabase/client";

// ===== Dashboard KPIs =====
export interface KpiSnapshot {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  newThisMonth: number;
  negativeBalanceCount: number;
  activeSessionsCount: number;
  openLeadsCount: number;
  pendingTasksCount: number;
  monthRevenue: number;
  bookingsThisMonth: number;
}

async function countRows(table: string, query = "select=id"): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      "Range-Unit": "items",
      Range: "0-0",
    },
    cache: "no-store",
  });
  const cr = res.headers.get("content-range");
  return cr ? Number(cr.split("/")[1]) : 0;
}

export async function getDashboardKpis(): Promise<KpiSnapshot> {
  const now = new Date();
  const ymStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const ymNext = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

  const [
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    newThisMonth,
    activeSessionsCount,
    openLeadsCount,
    pendingTasksCount,
    bookingsThisMonth,
  ] = await Promise.all([
    countRows("customers"),
    countRows("customers", `select=id&status=eq.${encodeURIComponent("פעיל")}`),
    countRows(
      "customers",
      `select=id&status=eq.${encodeURIComponent("לא פעיל")}`,
    ),
    countRows(
      "customers",
      `select=id&start_date=gte.${ymStart}&start_date=lt.${ymNext}`,
    ),
    countRows("sessions", `select=id&status=eq.${encodeURIComponent("פעיל")}`),
    countRows(
      "leads",
      `select=id&status=neq.${encodeURIComponent("נסגר")}&status=neq.${encodeURIComponent("לא רלוונטי")}`,
    ),
    countRows(
      "tasks",
      `select=id&or=(status.is.null,status.neq.${encodeURIComponent("בוצע")})`,
    ),
    countRows("bookings", `select=id&date=gte.${ymStart}&date=lt.${ymNext}`),
  ]);

  // Negative balance: pull all dashboard rows and count
  const allDashboard = await selectMany<{ balance_hours: number }>(
    "customer_dashboard",
    "select=balance_hours&balance_hours=lt.0",
  );
  const negativeBalanceCount = allDashboard.length;

  // Month revenue: SUM of payments where date is this month + status=שולם
  const monthPayments = await selectMany<{ amount: number | null }>(
    "payments",
    `select=amount&status=eq.${encodeURIComponent("שולם")}&payment_date=gte.${ymStart}&payment_date=lt.${ymNext}`,
  );
  const monthRevenue = monthPayments.reduce((s, p) => s + (p.amount ?? 0), 0);

  return {
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    newThisMonth,
    negativeBalanceCount,
    activeSessionsCount,
    openLeadsCount,
    pendingTasksCount,
    monthRevenue,
    bookingsThisMonth,
  };
}

// ===== Customers in negative balance =====
export interface NegativeBalanceCustomer {
  id: string;
  airtable_id: string;
  first_name: string | null;
  last_name: string | null;
  balance_hours: number;
}

export async function getNegativeBalanceCustomers(
  limit = 10,
): Promise<NegativeBalanceCustomer[]> {
  return selectMany<NegativeBalanceCustomer>(
    "customer_dashboard",
    `select=id,airtable_id,first_name,last_name,balance_hours&balance_hours=lt.0&order=balance_hours.asc&limit=${limit}`,
  );
}
