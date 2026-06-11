"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Whitelist of customer fields the admin may edit via this action.
// Adding a field here makes it editable; everything else is read-only.
const EDITABLE_FIELDS = ["status", "internal_notes", "phone"] as const;
type EditableField = (typeof EDITABLE_FIELDS)[number];

interface CustomerSnapshot {
  status: string | null;
  internal_notes: string | null;
  phone: string | null;
}

async function fetchSnapshot(id: string): Promise<CustomerSnapshot | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/customers?select=status,internal_notes,phone&id=eq.${encodeURIComponent(id)}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`fetch snapshot ${res.status}`);
  const rows = (await res.json()) as CustomerSnapshot[];
  return rows[0] ?? null;
}

async function writeAuditLog(
  recordId: string,
  changes: Record<string, { before: unknown; after: unknown }>,
  email: string,
): Promise<void> {
  const body = [
    {
      table_name: "customers",
      record_id: recordId,
      action: "update",
      changed_by_email: email,
      changes,
    },
  ];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/audit_log`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`audit log ${res.status}`);
}

async function applyUpdate(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`update customer ${res.status}: ${body.slice(0, 200)}`);
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    throw new Error("Unauthorized");
  }

  // Pull only whitelisted fields from the form
  const incoming: Record<string, string | null> = {};
  for (const field of EDITABLE_FIELDS) {
    const raw = formData.get(field);
    if (raw === null) continue;
    const value = String(raw).trim();
    incoming[field] = value === "" ? null : value;
  }
  if (Object.keys(incoming).length === 0) return;

  const before = await fetchSnapshot(id);
  if (!before) throw new Error("Customer not found");

  const diff: Record<string, { before: unknown; after: unknown }> = {};
  const patch: Record<string, unknown> = {};
  for (const [field, after] of Object.entries(incoming)) {
    const beforeValue = before[field as EditableField] ?? null;
    if (beforeValue !== after) {
      diff[field] = { before: beforeValue, after };
      patch[field] = after;
    }
  }

  if (Object.keys(patch).length === 0) {
    // Nothing changed - just redirect back
    redirect(`/admin/customers/${id}/details`);
  }

  await writeAuditLog(id, diff, session.email);
  await applyUpdate(id, patch);

  revalidatePath(`/admin/customers/${id}`, "layout");
  redirect(`/admin/customers/${id}/details`);
}
