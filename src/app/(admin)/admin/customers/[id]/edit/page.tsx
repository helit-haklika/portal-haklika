import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomer, listDistinctStatuses } from "@/lib/admin/queries";
import { updateCustomer } from "./actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: Props) {
  const { id } = await params;
  const [customer, statuses] = await Promise.all([
    getCustomer(id),
    listDistinctStatuses(),
  ]);
  if (!customer) notFound();

  const action = updateCustomer.bind(null, id);

  return (
    <div>
      <p style={{ color: "var(--ink-muted)", marginBottom: 16, fontSize: 14 }}>
        עריכה • שדה ששינוי בו נשמר ב-audit log
      </p>
      <form
        action={action}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxWidth: 600,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 12,
              color: "var(--ink-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontWeight: 600,
            }}
          >
            סטטוס לקוח
          </span>
          <select
            name="status"
            defaultValue={customer.status ?? ""}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <option value="">— ללא —</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 12,
              color: "var(--ink-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontWeight: 600,
            }}
          >
            טלפון
          </span>
          <input
            type="tel"
            name="phone"
            defaultValue={customer.phone ?? ""}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 12,
              color: "var(--ink-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontWeight: 600,
            }}
          >
            הערות פנימיות (צוות)
          </span>
          <textarea
            name="internal_notes"
            defaultValue={customer.internal_notes ?? ""}
            rows={6}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </label>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="submit" className="hk-btn hk-btn--primary">
            שמור שינויים
          </button>
          <Link
            href={`/admin/customers/${id}/details`}
            className="hk-btn hk-btn--ghost"
          >
            ביטול
          </Link>
        </div>
      </form>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--ink-muted)" }}>
        💡 כל שינוי נרשם ב-<code>audit_log</code> עם מי שינה, מתי, ומה היה הערך
        לפני ואחרי. רק 3 שדות ניתנים לעריכה בשלב זה: סטטוס, טלפון, הערות
        פנימיות.
      </p>
    </div>
  );
}
