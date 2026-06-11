#!/usr/bin/env node
// Phase 1: Full migration of all Airtable tables to Supabase.
// Idempotent (upsert by airtable_id). Run with:
//   node --experimental-strip-types --env-file=.env.local scripts/migrate-all.ts

const AIRTABLE_PAT = process.env.AIRTABLE_PAT!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env vars.");
  process.exit(1);
}

type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

// ===== Helpers =====
const str = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const int = (v: unknown): number | null => {
  const n = num(v);
  return n === null ? null : Math.round(n);
};
const bool = (v: unknown): boolean => v === true;
const date = (v: unknown): string | null => {
  const s = str(v);
  return s && s.length >= 10 ? s.slice(0, 10) : null;
};
const ts = (v: unknown): string | null => {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const arr = (v: unknown): string[] | null => {
  if (!Array.isArray(v)) return null;
  const out = v.map((x) => String(x).trim()).filter(Boolean);
  return out.length ? out : null;
};
const linkFirst = (v: unknown): string | null => {
  if (!Array.isArray(v) || v.length === 0) return null;
  return String(v[0]);
};
const lower = (v: unknown): string | null => str(v)?.toLowerCase() ?? null;

async function fetchAllAirtable(tableName: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  const encoded = encodeURIComponent(tableName);
  do {
    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encoded}`,
    );
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });
    if (!res.ok)
      throw new Error(
        `Airtable ${tableName} ${res.status}: ${await res.text()}`,
      );
    const data = (await res.json()) as {
      records: AirtableRecord[];
      offset?: string;
    };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

async function supabaseUpsert<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  conflictCol = "airtable_id",
) {
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictCol}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      },
    );
    if (!res.ok) {
      throw new Error(
        `Supabase upsert ${table} ${res.status}: ${(await res.text()).slice(0, 500)}`,
      );
    }
  }
}

async function loadAirtableIdMap(table: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=id,airtable_id`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Range: `${from}-${from + PAGE - 1}`,
          "Range-Unit": "items",
        },
      },
    );
    if (!res.ok) throw new Error(`Supabase load ${table}: ${res.status}`);
    const rows = (await res.json()) as { id: string; airtable_id: string }[];
    rows.forEach((r) => map.set(r.airtable_id, r.id));
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return map;
}

async function tableCount(table: string): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "count=exact",
      "Range-Unit": "items",
      Range: "0-0",
    },
  });
  const cr = res.headers.get("content-range");
  return cr ? Number(cr.split("/")[1]) : 0;
}

// ===== Per-table migrations =====

async function migrateCompounds() {
  const records = await fetchAllAirtable("מתחמים");
  const rows = records.map((r) => ({
    airtable_id: r.id,
    name: str(r.fields["שם מתחם"]) ?? "(ללא שם)",
    whatsapp_group_url: str(r.fields["קבוצת וואטסאפ"]),
  }));
  await supabaseUpsert("compounds", rows);
  return records.length;
}

async function migrateRooms() {
  const records = await fetchAllAirtable("חדרים");
  const rows = records.map((r) => ({
    airtable_id: r.id,
    name: str(r.fields["שם חדר"]) ?? "(ללא שם)",
    compound_name: str(r.fields["מתחם"]),
    room_type: str(r.fields["סוג חדר"]),
    address: str(r.fields["כתובת"]),
    opening_hours: str(r.fields["שעות פתיחה"]),
    default_pricing: str(r.fields["תמחור ברירת מחדל"]),
    usage_count: int(r.fields["Count (שימושים)"]),
  }));
  await supabaseUpsert("rooms", rows);
  return records.length;
}

async function migrateSessionPricing() {
  const records = await fetchAllAirtable("מחירון ססיות");
  const rows = records.map((r) => ({
    airtable_id: r.id,
    hours_per_month: num(r.fields["כמות שעות"]),
    price: num(r.fields["מחיר"]),
  }));
  await supabaseUpsert("session_pricing", rows);
  return records.length;
}

async function migrateDiscountTiers() {
  const records = await fetchAllAirtable("מדרגות הנחה");
  const rows = records.map((r) => ({
    airtable_id: r.id,
    min_amount: num(r.fields["סכום מינימלי"]),
    discount_percent: num(r.fields["אחוז הנחה"]),
  }));
  await supabaseUpsert("discount_tiers", rows);
  return records.length;
}

async function migrateMessageTemplates() {
  const records = await fetchAllAirtable("נוסחי הודעות");
  const rows = records.map((r) => ({
    airtable_id: r.id,
    title: str(r.fields["הודעה"]),
    body: str(r.fields["תוכן הודעה"]),
    category: str(r.fields["קטגוריה"]),
    description: str(r.fields["תיאור"]),
    template_number: num(r.fields["מספר הודעה"]),
    airtable_updated_at: ts(r.fields["Last Modified"]),
  }));
  await supabaseUpsert("message_templates", rows);
  return records.length;
}

async function migrateCustomers(compoundsMap: Map<string, string>) {
  // Customers already migrated by 0001 POC; this just adds/updates compound_id link.
  // We do a full upsert to keep mapping consistent.
  const records = await fetchAllAirtable("לקוחות");
  const f = (r: AirtableRecord) => r.fields;
  const rows = records.map((r) => {
    const compoundLinks = r.fields["מתחם 1"] as string[] | undefined;
    const compoundId =
      compoundLinks && compoundLinks[0]
        ? (compoundsMap.get(compoundLinks[0]) ?? null)
        : null;
    return {
      airtable_id: r.id,
      first_name: str(f(r)["שם פרטי"]),
      last_name: str(f(r)["שם משפחה"]),
      billing_name: str(f(r)["שם לחשבונית"]),
      phone: str(f(r)["טלפון"]),
      email: lower(f(r)["אימייל"]),
      email_secondary: lower(f(r)["אימייל נוסף"]),
      birth_date: date(f(r)["תאריך לידה"]),
      national_id: str(f(r)["תעודת זהות"]),
      business_id: str(f(r)["חפ/עמ"]),
      home_address: str(f(r)["כתובת מגורים"]),
      compound_name: str(f(r)["מתחם"]),
      compound_id: compoundId,
      status: str(f(r)["סטטוס לקוח"]),
      payment_type: str(f(r)["סוג תשלומים"]),
      standby_status: str(f(r)["לקוח בסטנד ביי"]),
      standby_days: arr(f(r)["סטנד ביי ליום"]),
      treatment_type: str(f(r)["סוג טיפול"]),
      treatment_duration: str(f(r)["משך זמן הטיפול שלי"]),
      max_patients_in_room: int(f(r)["כמות מטופלים מקסימלית בחדר"]),
      service_uses: arr(f(r)["שימושים מוצרים"]),
      rental_types: arr(f(r)["סןג שכירות"]),
      special_room_needs: str(
        f(r)["מה הדברים המיוחדים שנחוצים לי בשימוש בחדר?"],
      ),
      start_date: date(f(r)["תאריך התחלה"]),
      commitment_months: str(f(r)["חודשי התחייבות"]),
      standing_order_start_date: date(f(r)["תאריך תחילת הוראת קבע"]),
      work_start_date: date(f(r)["תאריך תחילת עבודה בקליקה"]),
      full_room_price: num(f(r)["מחיר לחד שלם"]),
      full_room_cleaning_price: num(f(r)["מחיר לניקיון חדר שלם"]),
      full_room_furniture_price: num(f(r)["מחיר לריהוט חדר שלם"]),
      morning_client_id: str(f(r)["MORNING CLIENT ID"]),
      about_me: str(f(r)["קצת על עצמי"]),
      website_url: str(f(r)["אתר"]),
      instagram_url: str(f(r)["אינסטגרם"]),
      facebook_url: str(f(r)["פייסבוק"]),
      other_url: str(f(r)["אחר"]),
      avg_patient_age: str(f(r)["גיל הממוצע של המטופלים שלי"]),
      patient_origin: str(f(r)["מאיזה איזור מגיעים רוב המטופלים שלי?"]),
      wants_promotion: str(
        f(r)["האם תרצה/י לקבל במה/פוסט ברשת החברתית של הקליקה?"],
      ),
      has_received_key: bool(f(r)["לקוח קיבל מפתח"]),
      completed_intake: bool(f(r)["לקוח סיים תהליך קליטה"]),
      standing_order_sent_for_approval: bool(
        f(r)["נשלחה הוראת קבע לאישור לקוח"],
      ),
      standing_order_sent_at: ts(f(r)["תאריך שליחת הוק לאישור"]),
      intake_payment_status: str(f(r)["סטטוס קליטה ותשלום"]),
      details_update_status: str(f(r)["סטטוס עדכון פרטים"]),
      no_overage_alerts: bool(f(r)["לא לשלוח הודעה על חריגה"]),
      no_low_balance_alerts: bool(
        f(r)["לא לשלוח הודעות ייתרה קרובה לסיום באוטומציה"],
      ),
      no_overage_messages: bool(f(r)["לא לשלוח הודעות חריגה באוטומציה"]),
      internal_notes: str(f(r)["הערות"]),
      customer_intake_summary: str(f(r)["סיכום טופס קליטת לקוח"]),
      contract_prep_summary: str(f(r)["סיכום טופס הכנת חוזה"]),
      contract_notes: str(f(r)["הערות לחוזה"]),
      legacy_credit_2024: num(f(r)["קרדיט - 2024"]) ?? 0,
      airtable_created_at: ts(f(r)["Created"]) ?? ts(r.createdTime),
      airtable_updated_at: ts(f(r)["תאריך עדכון אחרון"]),
    };
  });
  await supabaseUpsert("customers", rows);
  return records.length;
}

async function migrateSessionTransactions(customersMap: Map<string, string>) {
  const records = await fetchAllAirtable("עסקאות ססיה");
  const rows = records.map((r) => {
    const customerLink = linkFirst(r.fields["לקוח"]);
    return {
      airtable_id: r.id,
      airtable_number: int(r.fields["מספר עסקה"]),
      customer_id: customerLink
        ? (customersMap.get(customerLink) ?? null)
        : null,
      status: str(r.fields["סטטוס עסקה"]),
      start_date: date(r.fields["תאריך התחלה"]),
      standing_order_start_date: date(r.fields["תאריך תחילת הוראת קבע"]),
      price_before_discount: num(r.fields["מחיר לפני הנחה"]),
      price_after_discount: num(r.fields["מחיר אחרי הנחה"]),
      notes: str(r.fields["הערות"]),
      airtable_updated_at: ts(r.fields["Last Modified"]),
    };
  });
  await supabaseUpsert("session_transactions", rows);
  return records.length;
}

async function migrateSessions(
  customersMap: Map<string, string>,
  txMap: Map<string, string>,
) {
  const records = await fetchAllAirtable("ססיות");
  const rows = records.map((r) => {
    const customerLink = linkFirst(r.fields["לקוח"]);
    const txLink = linkFirst(r.fields["עסקת ססיה מקושרת"]);
    return {
      airtable_id: r.id,
      airtable_number: int(r.fields["מספר ססיה"]),
      customer_id: customerLink
        ? (customersMap.get(customerLink) ?? null)
        : null,
      session_transaction_id: txLink ? (txMap.get(txLink) ?? null) : null,
      status: str(r.fields["סטטוס ססיה"]),
      start_date: date(r.fields["תאריך התחלה"]),
      day_of_week: str(r.fields["יום"]),
      start_time: str(r.fields["שעת התחלה"]),
      end_time: str(r.fields["שעת סיום"]),
      room_name: str(r.fields["חדר"]),
      hours: num(r.fields["שעות"]),
      price_before_discount: num(r.fields["מחיר לפני הנחה"]),
      price_after_discount: num(r.fields["מחיר אחרי הנחה"]),
      pricing_subscription: str(r.fields["תמחור מנוי"]),
      notes: str(r.fields["הערות"]),
      airtable_updated_at: ts(r.fields["Last Modified"]),
    };
  });
  await supabaseUpsert("sessions", rows);
  return records.length;
}

async function migratePayments(
  customersMap: Map<string, string>,
  sessionsMap: Map<string, string>,
  txMap: Map<string, string>,
) {
  const records = await fetchAllAirtable("תשלומים");
  const rows = records.map((r) => {
    const cust = linkFirst(r.fields["לקוח"]);
    const sess = linkFirst(r.fields["ססיה"]);
    const tx = linkFirst(r.fields["עסקה מקושרת"]);
    return {
      airtable_id: r.id,
      customer_id: cust ? (customersMap.get(cust) ?? null) : null,
      session_id: sess ? (sessionsMap.get(sess) ?? null) : null,
      session_transaction_id: tx ? (txMap.get(tx) ?? null) : null,
      payment_type: str(r.fields["סוג תשלום"]),
      payment_method: str(r.fields["אמצעי תשלום"]),
      status: str(r.fields["סטטוס"]),
      payment_date: date(r.fields["תאריך תשלום"]),
      reference_number: str(r.fields["אסמכתא / מס׳ מסמך"]),
      amount: num(r.fields["סכום שולם"]),
      hours_purchased: num(r.fields["שעות כרטיסיה שנרכשו"]),
      description_from_morning: str(r.fields["תיאור תשלום ממורנינג"]),
      invoice_url: str(r.fields["קישור לחשבונית"]),
      compound_name: str(r.fields["מתחם"]),
      notes: str(r.fields["הערות"]),
      airtable_created_at: ts(r.fields["Created"]) ?? ts(r.createdTime),
    };
  });
  await supabaseUpsert("payments", rows);
  return records.length;
}

async function migrateBookings(
  customersMap: Map<string, string>,
  roomsMap: Map<string, string>,
  sessionsMap: Map<string, string>,
) {
  const records = await fetchAllAirtable("שימושים");
  const rows = records.map((r) => {
    const cust = linkFirst(r.fields["לקוח"]);
    const room = linkFirst(r.fields["חדר"]);
    const sess = linkFirst(r.fields["ססיה"]);
    return {
      airtable_id: r.id,
      airtable_number: int(r.fields["מספר שימוש"]),
      customer_id: cust ? (customersMap.get(cust) ?? null) : null,
      room_id: room ? (roomsMap.get(room) ?? null) : null,
      session_id: sess ? (sessionsMap.get(sess) ?? null) : null,
      booking_title: str(r.fields["Booking Title"]),
      status: str(r.fields["סטטוס שימוש"]),
      source: str(r.fields["מקור"]),
      date: date(r.fields["תאריך"]),
      start_at: ts(r.fields["התחלה"]),
      end_at: ts(r.fields["סיום"]),
      revenue_per_use: num(r.fields["הכנסה לשימוש (לפי תשלום אחרון)"]),
      source_import_id: str(r.fields["ID ייבוא מקור"]),
      notes: str(r.fields["הערות"]),
      airtable_created_at: ts(r.fields["Created"]) ?? ts(r.createdTime),
    };
  });
  await supabaseUpsert("bookings", rows);
  return records.length;
}

async function migrateSkeddaRaw() {
  const records = await fetchAllAirtable("ייבוא Skedda (Raw)");
  const rows = records.map((r) => ({
    airtable_id: r.id,
    external_id: str(r.fields["ID ייבוא מקור"]),
    start_at: ts(r.fields["תאריך התחלה"]),
    end_at: ts(r.fields["תאריך סיום"]),
    duration_minutes: num(r.fields["משך בדקות"]),
    activity_title: str(r.fields["כותרת / שם פעילות"]),
    first_name: str(r.fields["שם פרטי"]),
    last_name: str(r.fields["שם משפחה"]),
    email: lower(r.fields["אימייל"]),
    phone: str(r.fields["טלפון"]),
    room_name: str(r.fields["חדר"]),
    price: num(r.fields["מחיר"]),
    payment_status: str(r.fields["סטטוס תשלום"]),
    source_created_date: date(r.fields["תאריך יצירה"]),
    processed: bool(r.fields["סומן כמעובד?"]),
    error_notes: str(r.fields["שגיאה / הערות"]),
    airtable_created_at: ts(r.fields["Created"]) ?? ts(r.createdTime),
  }));
  await supabaseUpsert("skedda_raw_imports", rows);
  return records.length;
}

async function migrateLeads(customersMap: Map<string, string>) {
  // Merge: לידים + HAKLIKA TALK + dreamlab into leads table
  const all: AirtableRecord[] = [];
  const labeled: { rec: AirtableRecord; sourceTable: string }[] = [];

  const leads = await fetchAllAirtable("לידים");
  leads.forEach((r) => labeled.push({ rec: r, sourceTable: "leads" }));

  const talk = await fetchAllAirtable("HAKLIKA TALK");
  talk.forEach((r) => labeled.push({ rec: r, sourceTable: "haklika_talk" }));

  let dreamlab: AirtableRecord[] = [];
  try {
    dreamlab = await fetchAllAirtable("dreamlab");
    dreamlab.forEach((r) => labeled.push({ rec: r, sourceTable: "dreamlab" }));
  } catch {
    // dreamlab might not exist - ignore
  }

  const rows = labeled.map(({ rec: r, sourceTable }) => {
    const f = r.fields;
    const converted = linkFirst(f["לקוחות"]);
    const name =
      sourceTable === "haklika_talk"
        ? [str(f["שם פרטי"]), str(f["שם משפחה"])].filter(Boolean).join(" ") ||
          null
        : sourceTable === "dreamlab"
          ? str(f["Name"])
          : str(f["שם לקוח"]);
    return {
      airtable_id: r.id,
      source_table: sourceTable,
      category:
        str(f["קטגוריה"]) ?? (sourceTable === "dreamlab" ? "dreamlab" : "main"),
      name,
      phone: str(f["טלפון"]),
      email: lower(f["אימייל"]),
      status: str(f["סטטוס"] ?? f["Status"]),
      source: str(f["מקור הגעה"]),
      lead_source_type: str(f["מקור ליד"]),
      treatment_type: str(f["סוג טיפול"]),
      rental_type: str(f["סוג השכרה"]),
      location: str(f["מיקום"]),
      meeting_location: str(f["מיקום פגישה"]),
      meeting_at: ts(f["תאריך ושעת פגישה"]),
      follow_up_status: str(f["סטטוס פולאו אפ"]),
      customer_notes: str(f["הערות לקוח"]),
      internal_notes: str(f["הערות"] ?? f["Notes"]),
      task_helit: str(f["משימה הילית"]),
      task_avigail: str(f["משימה אביגיל"]),
      send_message_choice: str(f["מה לשלוח לליד?"]),
      short_link: str(f["לינק מקוצר לליד באינטרפייס"]),
      standby_days: arr(f["סטנד ביי ליום"]),
      excel_import_date: date(f["תאריך יצירה באקסל"]),
      last_follow_up_at: ts(f["תאריך פולאואפ אחרון"]),
      converted_to_customer_id: converted
        ? (customersMap.get(converted) ?? null)
        : null,
      airtable_created_at: ts(f["Created"]) ?? ts(r.createdTime),
    };
  });
  await supabaseUpsert("leads", rows);
  return rows.length;
}

async function migrateTasks(customersMap: Map<string, string>) {
  const records = await fetchAllAirtable("התראות ומשימות");
  const rows = records.map((r) => {
    const cust = linkFirst(r.fields["לקוח"]);
    return {
      airtable_id: r.id,
      customer_id: cust ? (customersMap.get(cust) ?? null) : null,
      title: str(r.fields["משימה/התראה"]),
      status: str(r.fields["סטטוס"]),
      notes: str(r.fields["הערות"]),
      airtable_created_at: ts(r.fields["נוצרה רשומה"]) ?? ts(r.createdTime),
    };
  });
  await supabaseUpsert("tasks", rows);
  return records.length;
}

async function migrateCallLogs(
  customersMap: Map<string, string>,
  leadsMap: Map<string, string>,
) {
  const records = await fetchAllAirtable("תיעוד שיחות");
  const rows = records.map((r) => {
    const cust = linkFirst(r.fields["לקוחות"]);
    const lead =
      linkFirst(r.fields["ליד"]) ?? linkFirst(r.fields["לידים copy"]);
    return {
      airtable_id: r.id,
      occurred_at: ts(r.fields["תאריך ושעה"]),
      log_type: str(r.fields["סוג"]),
      responsible: str(r.fields["אחראי"]),
      description: str(r.fields["תיאור"]),
      scheduled_message_content: str(r.fields["תוכן הודעה מתוזמנת"]),
      scheduled_send_at: ts(r.fields["תאריך ושעת תזמון"]),
      customer_id: cust ? (customersMap.get(cust) ?? null) : null,
      lead_id: lead ? (leadsMap.get(lead) ?? null) : null,
    };
  });
  await supabaseUpsert("call_logs", rows);
  return records.length;
}

// ===== Main =====
async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  process.stdout.write(`→ ${label}... `);
  const result = await fn();
  const ms = (performance.now() - t0).toFixed(0);
  console.log(
    `done (${ms}ms) ${typeof result === "number" ? `[${result} records]` : ""}`,
  );
  return result;
}

async function main() {
  console.log("=== Phase 1: full Airtable → Supabase migration ===\n");

  // Reference / leaf data first
  await step("compounds", migrateCompounds);
  await step("rooms", migrateRooms);
  await step("session_pricing", migrateSessionPricing);
  await step("discount_tiers", migrateDiscountTiers);
  await step("message_templates", migrateMessageTemplates);

  const compoundsMap = await step("load compounds map", () =>
    loadAirtableIdMap("compounds"),
  );
  await step("customers (with FK)", () => migrateCustomers(compoundsMap));

  const customersMap = await step("load customers map", () =>
    loadAirtableIdMap("customers"),
  );
  const roomsMap = await step("load rooms map", () =>
    loadAirtableIdMap("rooms"),
  );

  await step("session_transactions", () =>
    migrateSessionTransactions(customersMap),
  );
  const txMap = await step("load session_transactions map", () =>
    loadAirtableIdMap("session_transactions"),
  );

  await step("sessions", () => migrateSessions(customersMap, txMap));
  const sessionsMap = await step("load sessions map", () =>
    loadAirtableIdMap("sessions"),
  );

  await step("payments", () =>
    migratePayments(customersMap, sessionsMap, txMap),
  );
  await step("bookings", () =>
    migrateBookings(customersMap, roomsMap, sessionsMap),
  );
  await step("skedda_raw_imports", migrateSkeddaRaw);
  await step("leads (merged)", () => migrateLeads(customersMap));

  const leadsMap = await step("load leads map", () =>
    loadAirtableIdMap("leads"),
  );
  await step("tasks", () => migrateTasks(customersMap));
  await step("call_logs", () => migrateCallLogs(customersMap, leadsMap));

  // Final counts
  console.log("\n=== Final counts ===");
  const tables = [
    "compounds",
    "rooms",
    "session_pricing",
    "discount_tiers",
    "message_templates",
    "customers",
    "session_transactions",
    "sessions",
    "payments",
    "bookings",
    "skedda_raw_imports",
    "leads",
    "tasks",
    "call_logs",
  ];
  for (const t of tables) {
    const c = await tableCount(t);
    console.log(`  ${t.padEnd(24)} ${c}`);
  }
  console.log("\n✓ Done");
}

main().catch((e) => {
  console.error("\n✗ FAIL:", e);
  process.exit(1);
});
