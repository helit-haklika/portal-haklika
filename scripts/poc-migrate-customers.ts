#!/usr/bin/env node
// POC migration: Airtable "לקוחות" -> Supabase "customers"
// Run: node --experimental-strip-types --env-file=.env.local scripts/poc-migrate-customers.ts

const AIRTABLE_PAT = process.env.AIRTABLE_PAT!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TABLE = encodeURIComponent("לקוחות");

if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing env vars. Need AIRTABLE_PAT, AIRTABLE_BASE_ID, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

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
const bool = (v: unknown): boolean => v === true;
const date = (v: unknown): string | null => {
  const s = str(v);
  if (!s) return null;
  // Already YYYY-MM-DD or ISO
  return s.length >= 10 ? s.slice(0, 10) : null;
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

const mapRecord = (r: AirtableRecord) => {
  const f = r.fields;
  return {
    airtable_id: r.id,
    first_name: str(f["שם פרטי"]),
    last_name: str(f["שם משפחה"]),
    billing_name: str(f["שם לחשבונית"]),
    phone: str(f["טלפון"]),
    email: str(f["אימייל"])?.toLowerCase() ?? null,
    email_secondary: str(f["אימייל נוסף"])?.toLowerCase() ?? null,
    birth_date: date(f["תאריך לידה"]),
    national_id: str(f["תעודת זהות"]),
    business_id: str(f["חפ/עמ"]),
    home_address: str(f["כתובת מגורים"]),

    compound_name: str(f["מתחם"]),
    status: str(f["סטטוס לקוח"]),
    payment_type: str(f["סוג תשלומים"]),
    standby_status: str(f["לקוח בסטנד ביי"]),
    standby_days: arr(f["סטנד ביי ליום"]),

    treatment_type: str(f["סוג טיפול"]),
    treatment_duration: str(f["משך זמן הטיפול שלי"]),
    max_patients_in_room: num(f["כמות מטופלים מקסימלית בחדר"]),
    service_uses: arr(f["שימושים מוצרים"]),
    rental_types: arr(f["סןג שכירות"]),
    special_room_needs: str(f["מה הדברים המיוחדים שנחוצים לי בשימוש בחדר?"]),

    start_date: date(f["תאריך התחלה"]),
    commitment_months: str(f["חודשי התחייבות"]),
    standing_order_start_date: date(f["תאריך תחילת הוראת קבע"]),
    work_start_date: date(f["תאריך תחילת עבודה בקליקה"]),
    full_room_price: num(f["מחיר לחד שלם"]),
    full_room_cleaning_price: num(f["מחיר לניקיון חדר שלם"]),
    full_room_furniture_price: num(f["מחיר לריהוט חדר שלם"]),

    morning_client_id: str(f["MORNING CLIENT ID"]),

    about_me: str(f["קצת על עצמי"]),
    website_url: str(f["אתר"]),
    instagram_url: str(f["אינסטגרם"]),
    facebook_url: str(f["פייסבוק"]),
    other_url: str(f["אחר"]),
    avg_patient_age: str(f["גיל הממוצע של המטופלים שלי"]),
    patient_origin: str(f["מאיזה איזור מגיעים רוב המטופלים שלי?"]),
    wants_promotion: str(f["האם תרצה/י לקבל במה/פוסט ברשת החברתית של הקליקה?"]),

    has_received_key: bool(f["לקוח קיבל מפתח"]),
    completed_intake: bool(f["לקוח סיים תהליך קליטה"]),
    standing_order_sent_for_approval: bool(f["נשלחה הוראת קבע לאישור לקוח"]),
    standing_order_sent_at: ts(f["תאריך שליחת הוק לאישור"]),
    intake_payment_status: str(f["סטטוס קליטה ותשלום"]),
    details_update_status: str(f["סטטוס עדכון פרטים"]),
    no_overage_alerts: bool(f["לא לשלוח הודעה על חריגה"]),
    no_low_balance_alerts: bool(
      f["לא לשלוח הודעות ייתרה קרובה לסיום באוטומציה"],
    ),
    no_overage_messages: bool(f["לא לשלוח הודעות חריגה באוטומציה"]),

    internal_notes: str(f["הערות"]),
    customer_intake_summary: str(f["סיכום טופס קליטת לקוח"]),
    contract_prep_summary: str(f["סיכום טופס הכנת חוזה"]),
    contract_notes: str(f["הערות לחוזה"]),
    legacy_credit_2024: num(f["קרדיט - 2024"]) ?? 0,

    airtable_created_at: ts(f["Created"]) ?? ts(r.createdTime),
    airtable_updated_at: ts(f["תאריך עדכון אחרון"]),
  };
};

async function fetchAllAirtable(): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE}`,
    );
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      records: AirtableRecord[];
      offset?: string;
    };
    records.push(...data.records);
    offset = data.offset;
    process.stdout.write(`\r  Fetched ${records.length} customers...`);
  } while (offset);
  process.stdout.write("\n");
  return records;
}

async function supa(path: string, init?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok)
    throw new Error(`Supabase ${res.status} on ${path}: ${await res.text()}`);
  return res;
}

async function insertCustomers(rows: ReturnType<typeof mapRecord>[]) {
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await supa("customers?on_conflict=airtable_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(chunk),
    });
    process.stdout.write(
      `\r  Inserted ${Math.min(i + BATCH, rows.length)}/${rows.length}...`,
    );
  }
  process.stdout.write("\n");
}

async function countCustomers(): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=id`, {
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

async function benchmark() {
  console.log(
    "\n--- Benchmark: 5 parallel customer fetches (simulating portal load) ---",
  );
  // Pick 5 random customer ids
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/customers?select=id&limit=5`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    },
  );
  const sample = (await res.json()) as { id: string }[];
  if (sample.length === 0) {
    console.log("  No customers to benchmark");
    return;
  }

  const runs: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await Promise.all(
      sample.map((c) =>
        fetch(`${SUPABASE_URL}/rest/v1/customers?id=eq.${c.id}&select=*`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }).then((r) => r.json()),
      ),
    );
    runs.push(performance.now() - t0);
  }
  console.log(`  5 parallel queries x 5 runs:`);
  runs.forEach((ms, i) => console.log(`    run ${i + 1}: ${ms.toFixed(0)}ms`));
  const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
  console.log(`  avg: ${avg.toFixed(0)}ms`);
}

async function main() {
  console.log("→ Phase 0 POC: customers migration");
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  Airtable base: ${AIRTABLE_BASE_ID}\n`);

  // 1. Verify Supabase customers table exists
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/customers?select=id&limit=1`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }).then((r) => {
      if (!r.ok) throw new Error(`status ${r.status}`);
    });
  } catch (e) {
    console.error(
      "✗ customers table not found. Run supabase/migrations/0001_customers_poc.sql in Supabase SQL Editor first.",
    );
    process.exit(1);
  }

  // 2. Fetch all from Airtable
  console.log("Fetching from Airtable...");
  const records = await fetchAllAirtable();
  console.log(`  ✓ ${records.length} records fetched`);

  // 3. Map
  const rows = records.map(mapRecord);
  const sample = rows[0];
  console.log(
    `  Sample row: ${sample?.first_name} ${sample?.last_name} (${sample?.email})`,
  );

  // 4. Insert
  console.log("\nInserting into Supabase...");
  await insertCustomers(rows);

  // 5. Verify count
  const count = await countCustomers();
  console.log(
    `  ✓ Supabase now has ${count} customers (Airtable: ${records.length})`,
  );
  if (count !== records.length) {
    console.warn(`  ⚠ Count mismatch!`);
  }

  // 6. Benchmark
  await benchmark();

  console.log("\n✓ POC complete");
}

main().catch((e) => {
  console.error("\n✗ FAIL:", e);
  process.exit(1);
});
