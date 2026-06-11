// Server-only admin queries against Supabase, split by domain.
// Unlike src/lib/supabase/queries.ts (portal-facing, accepts legacy airtable_id),
// admin queries work directly with Supabase UUIDs and return raw rows for tables.

import "server-only";
import { selectMany } from "@/lib/supabase/client";

// ===== Tasks =====
export interface TaskListRow {
  id: string;
  airtable_id: string;
  customer_id: string | null;
  title: string | null;
  status: string | null;
  notes: string | null;
  airtable_created_at: string | null;
}

export interface TaskListFilters {
  status?: string;
  onlyOpen?: boolean;
}

export async function listTasks(
  filters: TaskListFilters = {},
): Promise<(TaskListRow & { customer_name: string | null })[]> {
  const params: string[] = [
    "select=id,airtable_id,customer_id,title,status,notes,airtable_created_at",
    "order=airtable_created_at.desc.nullslast",
    "limit=500",
  ];
  if (filters.status) {
    params.push(`status=eq.${encodeURIComponent(filters.status)}`);
  } else if (filters.onlyOpen) {
    params.push(`or=(status.is.null,status.neq.${encodeURIComponent("בוצע")})`);
  }
  const rows = await selectMany<TaskListRow>("tasks", params.join("&"));

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

export async function listTaskStatuses(): Promise<string[]> {
  const rows = await selectMany<{ status: string | null }>(
    "tasks",
    "select=status&status=not.is.null",
  );
  return Array.from(new Set(rows.map((r) => r.status!).filter(Boolean))).sort();
}
