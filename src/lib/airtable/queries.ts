import { listRecords, getRecord } from "./client";
import type {
  CustomerFields,
  PunchCardPaymentFields,
  BookingFields,
  SessionFields,
  SessionTransactionFields,
  SessionPaymentFields,
} from "./types";
import type {
  Customer,
  PunchCardPayment,
  Booking,
  ActiveSession,
  SessionTransaction,
  SessionPayment,
} from "@/types";

const TABLES = {
  CUSTOMERS: "tblIUoXFMdWuFldvr",
  PAYMENTS: "tblfGq7ezJ45irjed",
  BOOKINGS: "tblZKbBcLserEDH9D",
  SESSIONS: "tblp3BzSRFpcqVsXR",
  SESSION_TRANSACTIONS: "tbltJwGoN4OUtKaHq",
} as const;

function formatCurrency(amount?: number): string {
  if (!amount) return "₪0";
  return `₪${amount.toLocaleString("he-IL")}`;
}

function formatDate(isoDate?: string): string {
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

function getDayOfWeek(isoDate?: string): string {
  if (!isoDate) return "";
  return DAYS_HE[new Date(isoDate).getDay()] ?? "";
}

export async function fetchCustomer(
  customerId: string,
): Promise<Customer | null> {
  const record = await getRecord<CustomerFields>(TABLES.CUSTOMERS, customerId);
  if (!record) return null;
  const f = record.fields;
  return {
    id: record.id,
    name: f["שם לקוח"] ?? "",
    email: f["אימייל"] ?? "",
    additionalEmail: f["אימייל נוסף"],
    balance: f["ייתרה לפי חישוב"] ?? 0,
    isActive: f["סטטוס לקוח"] !== "לא פעיל",
    updateFormUrl: f["טופס עדכון פרטי לקוח"],
  };
}

export async function fetchPunchCardPayments(
  customerId: string,
): Promise<PunchCardPayment[]> {
  const records = await listRecords<PunchCardPaymentFields>(TABLES.PAYMENTS, {
    filterByFormula: `AND(FIND('${customerId}', ARRAYJOIN({לקוח})), {סוג תשלום}='כרטיסיה', {סטטוס}='שולם', IS_AFTER({תאריך תשלום}, '2024-12-31'))`,
    sort: [{ field: "תאריך תשלום", direction: "desc" }],
  });
  return records.map((r) => ({
    id: r.id,
    date: formatDate(r.fields["תאריך תשלום"]),
    dayOfWeek: getDayOfWeek(r.fields["תאריך תשלום"]),
    hours: r.fields["שעות כרטיסיה שנרכשו"] ?? 0,
    amountPaid: formatCurrency(r.fields["סכום שולם"]),
    invoiceUrl: r.fields["קישור לחשבונית"],
  }));
}

export async function fetchBookings(customerId: string): Promise<Booking[]> {
  const records = await listRecords<BookingFields>(TABLES.BOOKINGS, {
    filterByFormula: `AND(FIND('${customerId}', ARRAYJOIN({לקוח})), {Booking Title}='שעתי', IS_AFTER({תאריך}, '2024-12-31'))`,
    sort: [{ field: "תאריך", direction: "desc" }],
  });
  return records.map((r) => ({
    id: r.id,
    date: formatDate(r.fields["תאריך"]),
    dayOfWeek: getDayOfWeek(r.fields["תאריך"]),
    roomName: r.fields["שם חדר (from חדר)"]?.[0] ?? "",
    startTime: r.fields["שעת התחלה מפורמט"] ?? "",
    endTime: r.fields["שעת סיום מפורמט"] ?? "",
    durationHours: r.fields["משך בשעות"] ?? 0,
    balanceAfter: r.fields["ייתרת שעות לאחר שימוש"] ?? 0,
    isCurrentMonth: r.fields["בחודש הנוכחי?"] ?? false,
  }));
}

export async function fetchActiveSessions(
  customerId: string,
): Promise<ActiveSession[]> {
  const records = await listRecords<SessionFields>(TABLES.SESSIONS, {
    filterByFormula: `AND(FIND('${customerId}', ARRAYJOIN({לקוח})), {סטטוס ססיה}='פעיל')`,
  });
  return records.map((r) => ({
    id: r.id,
    dayOfWeek: r.fields["יום"] ?? "",
    startTime: r.fields["שעת התחלה"] ?? "",
    endTime: r.fields["שעת סיום"] ?? "",
    basePriceBeforeDiscount: formatCurrency(r.fields["מחיר לפני הנחה"]),
    roomName: r.fields["חדר"]?.[0] ?? "",
  }));
}

export async function fetchSessionTransactions(
  customerId: string,
): Promise<SessionTransaction[]> {
  const records = await listRecords<SessionTransactionFields>(
    TABLES.SESSION_TRANSACTIONS,
    {
      filterByFormula: `AND(FIND('${customerId}', ARRAYJOIN({לקוח})), {סטטוס עסקה}='פעיל')`,
    },
  );
  return records.map((r) => ({
    id: r.id,
    priceAfterDiscount: r.fields["מחיר אחרי הנחה"] ?? 0,
  }));
}

export async function fetchSessionPayments(
  customerId: string,
): Promise<SessionPayment[]> {
  const records = await listRecords<SessionPaymentFields>(TABLES.PAYMENTS, {
    filterByFormula: `AND(FIND('${customerId}', ARRAYJOIN({לקוח})), {סוג תשלום}='ססיה', {סטטוס}='שולם', IS_AFTER({תאריך תשלום}, '2024-12-31'))`,
    sort: [{ field: "תאריך תשלום", direction: "desc" }],
  });
  return records.map((r) => ({
    id: r.id,
    date: formatDate(r.fields["תאריך תשלום"]),
    dayOfWeek: getDayOfWeek(r.fields["תאריך תשלום"]),
    amountPaid: formatCurrency(r.fields["סכום שולם"]),
    invoiceUrl: r.fields["קישור לחשבונית"],
  }));
}
