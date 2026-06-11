// Server-only admin queries against Supabase, split by domain.
// Unlike src/lib/supabase/queries.ts (portal-facing, accepts legacy airtable_id),
// admin queries work directly with Supabase UUIDs and return raw rows for tables.

import "server-only";
import { selectOne, selectMany } from "@/lib/supabase/client";

// ===== Customer list =====
export interface CustomerListRow {
  id: string;
  airtable_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  payment_type: string | null;
  compound_name: string | null;
  start_date: string | null;
  airtable_updated_at: string | null;
}

export interface CustomerListFilters {
  search?: string;
  status?: string;
  paymentType?: string;
  compound?: string;
}

export async function listCustomers(
  filters: CustomerListFilters = {},
): Promise<CustomerListRow[]> {
  const params: string[] = [
    "select=id,airtable_id,first_name,last_name,email,phone,status,payment_type,compound_name,start_date,airtable_updated_at",
    "order=first_name.asc.nullslast,last_name.asc.nullslast",
  ];

  if (filters.status)
    params.push(`status=eq.${encodeURIComponent(filters.status)}`);
  if (filters.paymentType)
    params.push(`payment_type=eq.${encodeURIComponent(filters.paymentType)}`);
  if (filters.compound)
    params.push(`compound_name=eq.${encodeURIComponent(filters.compound)}`);

  if (filters.search) {
    const s = filters.search.trim().toLowerCase();
    // Match any of first_name, last_name, email, phone
    const term = encodeURIComponent(`%${s}%`);
    params.push(
      `or=(first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term})`,
    );
  }

  return selectMany<CustomerListRow>("customers", params.join("&"));
}

// ===== Filter option lists =====
export async function listDistinctStatuses(): Promise<string[]> {
  const rows = await selectMany<{ status: string | null }>(
    "customers",
    "select=status&status=not.is.null",
  );
  return Array.from(new Set(rows.map((r) => r.status!).filter(Boolean))).sort();
}

export async function listDistinctPaymentTypes(): Promise<string[]> {
  const rows = await selectMany<{ payment_type: string | null }>(
    "customers",
    "select=payment_type&payment_type=not.is.null",
  );
  return Array.from(
    new Set(rows.map((r) => r.payment_type!).filter(Boolean)),
  ).sort();
}

export async function listDistinctCompounds(): Promise<string[]> {
  const rows = await selectMany<{ compound_name: string | null }>(
    "customers",
    "select=compound_name&compound_name=not.is.null",
  );
  return Array.from(
    new Set(rows.map((r) => r.compound_name!).filter(Boolean)),
  ).sort();
}

// ===== Customer detail =====
export interface CustomerDetailRow {
  id: string;
  airtable_id: string;
  first_name: string | null;
  last_name: string | null;
  billing_name: string | null;
  phone: string | null;
  email: string | null;
  email_secondary: string | null;
  birth_date: string | null;
  national_id: string | null;
  business_id: string | null;
  home_address: string | null;
  compound_name: string | null;
  status: string | null;
  payment_type: string | null;
  standby_status: string | null;
  standby_days: string[] | null;
  treatment_type: string | null;
  treatment_duration: string | null;
  max_patients_in_room: number | null;
  service_uses: string[] | null;
  rental_types: string[] | null;
  start_date: string | null;
  commitment_months: string | null;
  standing_order_start_date: string | null;
  work_start_date: string | null;
  full_room_price: number | null;
  morning_client_id: string | null;
  about_me: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  has_received_key: boolean | null;
  completed_intake: boolean | null;
  internal_notes: string | null;
  customer_intake_summary: string | null;
  contract_prep_summary: string | null;
  legacy_credit_2024: number | null;
  airtable_created_at: string | null;
  airtable_updated_at: string | null;
}

export async function getCustomer(
  id: string,
): Promise<CustomerDetailRow | null> {
  return selectOne<CustomerDetailRow>("customers", `select=*&id=eq.${encodeURIComponent(id)}`);
}

export interface DashboardSummary {
  id: string;
  balance_hours: number;
}

export async function getCustomerBalance(id: string): Promise<number> {
  const row = await selectOne<{ balance_hours: number }>(
    "customer_dashboard",
    `select=balance_hours&id=eq.${encodeURIComponent(id)}`,
  );
  return row?.balance_hours ?? 0;
}
