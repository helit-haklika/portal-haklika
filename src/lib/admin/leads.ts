// Server-only admin queries against Supabase, split by domain.
// Unlike src/lib/supabase/queries.ts (portal-facing, accepts legacy airtable_id),
// admin queries work directly with Supabase UUIDs and return raw rows for tables.

import "server-only";
import { selectMany } from "@/lib/supabase/client";

// ===== Leads =====
export interface LeadListRow {
  id: string;
  airtable_id: string;
  source_table: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  source: string | null;
  treatment_type: string | null;
  rental_type: string | null;
  meeting_at: string | null;
  follow_up_status: string | null;
  last_follow_up_at: string | null;
  converted_to_customer_id: string | null;
  airtable_created_at: string | null;
}

export interface LeadListFilters {
  search?: string;
  status?: string;
  source?: string;
  sourceTable?: string;
}

export async function listLeads(
  filters: LeadListFilters = {},
): Promise<LeadListRow[]> {
  const params: string[] = [
    "select=id,airtable_id,source_table,name,phone,email,status,source,treatment_type,rental_type,meeting_at,follow_up_status,last_follow_up_at,converted_to_customer_id,airtable_created_at",
    "order=airtable_created_at.desc.nullslast",
    "limit=500",
  ];
  if (filters.status)
    params.push(`status=eq.${encodeURIComponent(filters.status)}`);
  if (filters.source)
    params.push(`source=eq.${encodeURIComponent(filters.source)}`);
  if (filters.sourceTable)
    params.push(`source_table=eq.${encodeURIComponent(filters.sourceTable)}`);
  if (filters.search) {
    const term = encodeURIComponent(`%${filters.search.trim()}%`);
    params.push(
      `or=(name.ilike.${term},email.ilike.${term},phone.ilike.${term})`,
    );
  }
  return selectMany<LeadListRow>("leads", params.join("&"));
}

export async function listLeadStatuses(): Promise<string[]> {
  const rows = await selectMany<{ status: string | null }>(
    "leads",
    "select=status&status=not.is.null",
  );
  return Array.from(new Set(rows.map((r) => r.status!).filter(Boolean))).sort();
}

export async function listLeadSources(): Promise<string[]> {
  const rows = await selectMany<{ source: string | null }>(
    "leads",
    "select=source&source=not.is.null",
  );
  return Array.from(new Set(rows.map((r) => r.source!).filter(Boolean))).sort();
}
