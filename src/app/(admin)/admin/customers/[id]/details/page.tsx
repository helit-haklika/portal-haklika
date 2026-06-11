import { getCustomer } from "@/lib/admin/queries";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined | string[];
}) {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);
  const display = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  return (
    <div>
      <dt>{label}</dt>
      <dd className={isEmpty ? "empty" : ""}>{isEmpty ? "—" : display}</dd>
    </div>
  );
}

export default async function CustomerDetails({ params }: Props) {
  const { id } = await params;
  const c = await getCustomer(id);
  if (!c) notFound();

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>
        פרטים אישיים
      </h3>
      <dl className="hk-fields" style={{ marginBottom: 24 }}>
        <Field label="שם פרטי" value={c.first_name} />
        <Field label="שם משפחה" value={c.last_name} />
        <Field label="שם לחשבונית" value={c.billing_name} />
        <Field label="טלפון" value={c.phone} />
        <Field label="אימייל" value={c.email} />
        <Field label="אימייל נוסף" value={c.email_secondary} />
        <Field label="תאריך לידה" value={formatDate(c.birth_date)} />
        <Field label="תעודת זהות" value={c.national_id} />
        <Field label="חפ/עמ" value={c.business_id} />
        <Field label="כתובת מגורים" value={c.home_address} />
      </dl>

      <h3 style={{ marginBottom: 12, fontSize: 16 }}>פרטי לקוח עסקיים</h3>
      <dl className="hk-fields" style={{ marginBottom: 24 }}>
        <Field label="מתחם" value={c.compound_name} />
        <Field label="סטטוס לקוח" value={c.status} />
        <Field label="סוג תשלום" value={c.payment_type} />
        <Field label="סוג טיפול" value={c.treatment_type} />
        <Field label="משך טיפול" value={c.treatment_duration} />
        <Field label="כמות מטופלים בחדר" value={c.max_patients_in_room} />
        <Field label="שימושים מוצרים" value={c.service_uses} />
        <Field label="סוג שכירות" value={c.rental_types} />
        <Field label="סטנד ביי" value={c.standby_status} />
        <Field label="סטנד ביי ליום" value={c.standby_days} />
        <Field label="קיבל מפתח?" value={c.has_received_key ? "כן" : "לא"} />
        <Field
          label="סיים תהליך קליטה?"
          value={c.completed_intake ? "כן" : "לא"}
        />
      </dl>

      <h3 style={{ marginBottom: 12, fontSize: 16 }}>חוזה ותשלום</h3>
      <dl className="hk-fields" style={{ marginBottom: 24 }}>
        <Field label="תאריך התחלה" value={formatDate(c.start_date)} />
        <Field label="חודשי התחייבות" value={c.commitment_months} />
        <Field
          label="תאריך תחילת הוראת קבע"
          value={formatDate(c.standing_order_start_date)}
        />
        <Field
          label="תאריך תחילת עבודה בקליקה"
          value={formatDate(c.work_start_date)}
        />
        <Field
          label="מחיר חדר שלם"
          value={
            c.full_room_price
              ? `₪${c.full_room_price.toLocaleString("he-IL")}`
              : null
          }
        />
        <Field label="קרדיט 2024" value={c.legacy_credit_2024} />
        <Field label="Morning Client ID" value={c.morning_client_id} />
      </dl>

      <h3 style={{ marginBottom: 12, fontSize: 16 }}>אודות / קישורים</h3>
      <dl className="hk-fields" style={{ marginBottom: 24 }}>
        <Field label="קצת על עצמי" value={c.about_me} />
        <Field label="אתר" value={c.website_url} />
        <Field label="אינסטגרם" value={c.instagram_url} />
        <Field label="פייסבוק" value={c.facebook_url} />
      </dl>

      <h3 style={{ marginBottom: 12, fontSize: 16 }}>הערות פנימיות</h3>
      <dl className="hk-fields" style={{ marginBottom: 24 }}>
        <Field label="הערות צוות" value={c.internal_notes} />
        <Field label="סיכום טופס קליטה" value={c.customer_intake_summary} />
        <Field label="סיכום טופס הכנת חוזה" value={c.contract_prep_summary} />
      </dl>

      <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 16 }}>
        נוצר ב-Airtable: {formatDate(c.airtable_created_at)} • עודכן לאחרונה:{" "}
        {formatDate(c.airtable_updated_at)} • Airtable ID:{" "}
        <code>{c.airtable_id}</code>
      </p>
    </div>
  );
}
