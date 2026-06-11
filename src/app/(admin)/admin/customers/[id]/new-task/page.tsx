import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/admin/queries";
import { createTaskForCustomer } from "../_actions/create-task";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewTaskPage({ params }: Props) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const action = createTaskForCustomer.bind(null, id);

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>
        משימה חדשה
      </h3>

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
            כותרת המשימה *
          </span>
          <input
            type="text"
            name="title"
            required
            placeholder="לדוגמה: להתקשר ולברר על אי-הופעה"
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
            הערות (אופציונלי)
          </span>
          <textarea
            name="notes"
            rows={4}
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
            צור משימה
          </button>
          <Link
            href={`/admin/customers/${id}`}
            className="hk-btn hk-btn--ghost"
          >
            ביטול
          </Link>
        </div>
      </form>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--ink-muted)" }}>
        💡 משימה חדשה תיווצר עם סטטוס "לטיפול" ותופיע ב-
        <Link href="/admin/tasks">/admin/tasks</Link>. השינוי נרשם ב-audit_log.
      </p>
    </div>
  );
}
