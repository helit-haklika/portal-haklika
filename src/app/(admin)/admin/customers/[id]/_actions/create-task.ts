"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createTaskForCustomer(
  customerId: string,
  formData: FormData,
) {
  const session = await getCurrentSession();
  if (!session?.isAdmin) {
    throw new Error("Unauthorized");
  }

  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!title) {
    throw new Error("Task title is required");
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify([
      {
        airtable_id: `manual:${session.email}:${Date.now()}`,
        customer_id: customerId,
        title,
        notes: notes || null,
        status: "לטיפול",
      },
    ]),
  });
  if (!insertRes.ok) {
    const body = await insertRes.text().catch(() => "");
    throw new Error(`create task ${insertRes.status}: ${body.slice(0, 200)}`);
  }
  const [created] = (await insertRes.json()) as { id: string }[];

  // Audit log
  await fetch(`${SUPABASE_URL}/rest/v1/audit_log`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify([
      {
        table_name: "tasks",
        record_id: created.id,
        action: "insert",
        changed_by_email: session.email,
        changes: { title, notes, customer_id: customerId, status: "לטיפול" },
      },
    ]),
  });

  revalidatePath(`/admin/customers/${customerId}`, "layout");
  revalidatePath("/admin/tasks");
  redirect(`/admin/customers/${customerId}`);
}
