import { getCustomerSessions } from "@/lib/admin/queries";

interface Props {
  params: Promise<{ id: string }>;
}

function formatCurrency(amount?: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return `₪${amount.toLocaleString("he-IL")}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function statusPill(status: string | null): string {
  if (!status) return "hk-pill hk-pill--neutral";
  if (status === "פעיל") return "hk-pill hk-pill--active";
  if (status === "לא פעיל") return "hk-pill hk-pill--inactive";
  return "hk-pill hk-pill--neutral";
}

export default async function CustomerSessions({ params }: Props) {
  const { id } = await params;
  const sessions = await getCustomerSessions(id);
  const active = sessions.filter((s) => s.status === "פעיל");

  return (
    <div>
      <p style={{ color: "var(--ink-muted)", marginBottom: 16 }}>
        {sessions.length} ססיות • <strong>{active.length} פעילות</strong>
      </p>

      {sessions.length === 0 ? (
        <p>אין ססיות</p>
      ) : (
        <table className="hk-table">
          <thead>
            <tr>
              <th scope="col">סטטוס</th>
              <th scope="col">יום</th>
              <th scope="col">שעות</th>
              <th scope="col">חדר</th>
              <th scope="col">שעות בחודש</th>
              <th scope="col">מחיר לפני הנחה</th>
              <th scope="col">מחיר אחרי הנחה</th>
              <th scope="col">תאריך התחלה</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className={statusPill(s.status)}>
                    {s.status ?? "—"}
                  </span>
                </td>
                <td>{s.day_of_week ?? "—"}</td>
                <td className="hk-num">
                  {s.start_time}–{s.end_time}
                </td>
                <td>{s.room_name ?? "—"}</td>
                <td className="hk-num">{s.hours ?? "—"}</td>
                <td className="hk-num">
                  {formatCurrency(s.price_before_discount)}
                </td>
                <td className="hk-num">
                  {formatCurrency(s.price_after_discount)}
                </td>
                <td>{formatDate(s.start_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
