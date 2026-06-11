// Data source router for the portal.
// Reads DATA_SOURCE env var (default: 'airtable').
// Set DATA_SOURCE=supabase to read from Supabase instead of Airtable.
// Both sources expose the same interface and return the same types.
//
// supabaseId (optional, second arg): when present, lets Supabase queries skip
// the airtable_id → uuid lookup (cached in JWT after login).

import * as airtableQueries from "@/lib/airtable/queries";
import * as supabaseQueries from "@/lib/supabase/queries";
import type {
  Customer,
  PunchCardPayment,
  Booking,
  ActiveSession,
  SessionTransaction,
  SessionPayment,
} from "@/types";

function getSource(): "airtable" | "supabase" {
  return process.env.DATA_SOURCE === "supabase" ? "supabase" : "airtable";
}

export function getDataSource(): "airtable" | "supabase" {
  return getSource();
}

export function fetchCustomer(
  customerId: string,
  supabaseId?: string,
): Promise<Customer | null> {
  return getSource() === "supabase"
    ? supabaseQueries.fetchCustomer(customerId, supabaseId)
    : airtableQueries.fetchCustomer(customerId);
}

export function fetchPunchCardPayments(
  customerId: string,
  supabaseId?: string,
): Promise<PunchCardPayment[]> {
  return getSource() === "supabase"
    ? supabaseQueries.fetchPunchCardPayments(customerId, supabaseId)
    : airtableQueries.fetchPunchCardPayments(customerId);
}

export function fetchBookings(
  customerId: string,
  supabaseId?: string,
): Promise<Booking[]> {
  return getSource() === "supabase"
    ? supabaseQueries.fetchBookings(customerId, supabaseId)
    : airtableQueries.fetchBookings(customerId);
}

export function fetchActiveSessions(
  customerId: string,
  supabaseId?: string,
): Promise<ActiveSession[]> {
  return getSource() === "supabase"
    ? supabaseQueries.fetchActiveSessions(customerId, supabaseId)
    : airtableQueries.fetchActiveSessions(customerId);
}

export function fetchSessionTransactions(
  customerId: string,
  supabaseId?: string,
): Promise<SessionTransaction[]> {
  return getSource() === "supabase"
    ? supabaseQueries.fetchSessionTransactions(customerId, supabaseId)
    : airtableQueries.fetchSessionTransactions(customerId);
}

export function fetchSessionPayments(
  customerId: string,
  supabaseId?: string,
): Promise<SessionPayment[]> {
  return getSource() === "supabase"
    ? supabaseQueries.fetchSessionPayments(customerId, supabaseId)
    : airtableQueries.fetchSessionPayments(customerId);
}

// Email-based customer lookup used by /api/auth/request-link.
// Returns rows shaped consistently between sources. supabaseId is populated
// when reading from Supabase so the caller can stash it in the JWT.
export interface CustomerLookupRow {
  id: string; // legacy airtable rec id (preserved across sources)
  supabaseId?: string;
  name: string;
  isActive: boolean;
}

export async function findCustomerByEmail(
  email: string,
): Promise<CustomerLookupRow[]> {
  if (getSource() === "supabase") {
    const rows = await supabaseQueries.findCustomerByEmail(email);
    return rows.map((r) => ({
      id: r.airtable_id,
      supabaseId: r.id,
      name: r.name,
      isActive: r.isActive,
    }));
  }
  // Airtable path
  const { listRecords } = await import("@/lib/airtable/client");
  const escaped = email.trim().toLowerCase().replace(/'/g, "\\'");
  const records = await listRecords<{
    "סטטוס לקוח"?: string;
    "שם פרטי"?: string;
    "שם לקוח"?: string;
  }>("tblIUoXFMdWuFldvr", {
    filterByFormula: `OR(LOWER({אימייל})='${escaped}', LOWER({אימייל נוסף})='${escaped}')`,
    maxRecords: 10,
  });
  return records.map((r) => ({
    id: r.id,
    name: r.fields["שם פרטי"] || r.fields["שם לקוח"] || "",
    isActive: r.fields["סטטוס לקוח"] !== "לא פעיל",
  }));
}
