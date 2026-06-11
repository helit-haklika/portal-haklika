// Server-only admin queries against Supabase, split by domain.
// Unlike src/lib/supabase/queries.ts (portal-facing, accepts legacy airtable_id),
// admin queries work directly with Supabase UUIDs and return raw rows for tables.

import "server-only";
import { selectMany } from "@/lib/supabase/client";

// ===== Customer's sessions =====
export interface SessionListRow {
  id: string;
  status: string | null;
  start_date: string | null;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  room_name: string | null;
  hours: number | null;
  price_before_discount: number | null;
  price_after_discount: number | null;
}

export async function getCustomerSessions(
  customerId: string,
): Promise<SessionListRow[]> {
  return selectMany<SessionListRow>(
    "sessions",
    `select=id,status,start_date,day_of_week,start_time,end_time,room_name,hours,price_before_discount,price_after_discount&customer_id=eq.${encodeURIComponent(customerId)}&order=status.asc,start_date.desc.nullslast`,
  );
}

// ===== Global sessions list =====
export interface GlobalSessionRow {
  id: string;
  customer_id: string | null;
  status: string | null;
  start_date: string | null;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  room_name: string | null;
  hours: number | null;
  price_before_discount: number | null;
  price_after_discount: number | null;
  session_transaction_id: string | null;
}

export interface GlobalSessionFilters {
  status?: string;
  day?: string;
}

export async function listSessions(
  filters: GlobalSessionFilters = {},
): Promise<(GlobalSessionRow & { customer_name: string | null })[]> {
  const params: string[] = [
    "select=id,customer_id,status,start_date,day_of_week,start_time,end_time,room_name,hours,price_before_discount,price_after_discount,session_transaction_id",
    "order=status.asc,day_of_week.asc,start_time.asc",
    "limit=500",
  ];
  if (filters.status)
    params.push(`status=eq.${encodeURIComponent(filters.status)}`);
  if (filters.day)
    params.push(`day_of_week=eq.${encodeURIComponent(filters.day)}`);

  const rows = await selectMany<GlobalSessionRow>("sessions", params.join("&"));
  const customerIds = Array.from(
    new Set(rows.map((r) => r.customer_id).filter((x): x is string => !!x)),
  );
  const nameById = new Map<string, string>();
  if (customerIds.length) {
    const customers = await selectMany<{
      id: string;
      first_name: string | null;
      last_name: string | null;
    }>(
      "customers",
      `select=id,first_name,last_name&id=in.(${customerIds.join(",")})`,
    );
    customers.forEach((c) =>
      nameById.set(
        c.id,
        [c.first_name, c.last_name].filter(Boolean).join(" ").trim() ||
          "(ללא שם)",
      ),
    );
  }
  return rows.map((r) => ({
    ...r,
    customer_name: r.customer_id ? (nameById.get(r.customer_id) ?? null) : null,
  }));
}
