// Server-only admin queries against Supabase, split by domain.
// Unlike src/lib/supabase/queries.ts (portal-facing, accepts legacy airtable_id),
// admin queries work directly with Supabase UUIDs and return raw rows for tables.

import "server-only";
import { selectMany } from "@/lib/supabase/client";

// ===== Customer's payments =====
export interface PaymentListRow {
  id: string;
  payment_date: string | null;
  payment_type: string | null;
  payment_method: string | null;
  status: string | null;
  amount: number | null;
  hours_purchased: number | null;
  reference_number: string | null;
  invoice_url: string | null;
  description_from_morning: string | null;
}

export async function getCustomerPayments(
  customerId: string,
): Promise<PaymentListRow[]> {
  return selectMany<PaymentListRow>(
    "payments",
    `select=id,payment_date,payment_type,payment_method,status,amount,hours_purchased,reference_number,invoice_url,description_from_morning&customer_id=eq.${encodeURIComponent(customerId)}&order=payment_date.desc.nullslast`,
  );
}

// ===== Global payments list =====
export interface GlobalPaymentRow {
  id: string;
  customer_id: string | null;
  payment_date: string | null;
  payment_type: string | null;
  payment_method: string | null;
  status: string | null;
  amount: number | null;
  hours_purchased: number | null;
  reference_number: string | null;
  invoice_url: string | null;
}

export interface GlobalPaymentFilters {
  type?: string;
  status?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  limit?: number;
}

export async function listPayments(
  filters: GlobalPaymentFilters = {},
): Promise<(GlobalPaymentRow & { customer_name: string | null })[]> {
  const params: string[] = [
    "select=id,customer_id,payment_date,payment_type,payment_method,status,amount,hours_purchased,reference_number,invoice_url",
    "order=payment_date.desc.nullslast",
    `limit=${filters.limit ?? 200}`,
  ];
  if (filters.type)
    params.push(`payment_type=eq.${encodeURIComponent(filters.type)}`);
  if (filters.status)
    params.push(`status=eq.${encodeURIComponent(filters.status)}`);
  if (filters.from) params.push(`payment_date=gte.${filters.from}`);
  if (filters.to) params.push(`payment_date=lte.${filters.to}`);

  const rows = await selectMany<GlobalPaymentRow>("payments", params.join("&"));

  // Batch-fetch customer names
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
