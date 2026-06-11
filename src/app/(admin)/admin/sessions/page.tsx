import Link from "next/link";
import { listSessions } from "@/lib/admin/queries";

interface SearchParams {
  status?: string;
  day?: string;
}

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function formatCurrency(amount: number | null): string {
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

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sessions = await listSessions({
    status: params.status ?? "פעיל",
    day: params.day,
  });

  const totalMonthlyRevenue = sessions
    .filter((s) => s.status === "פעיל")
    .reduce(
      (acc, x) =>
        acc + (x.price_after_discount ?? x.price_before_discount ?? 0),
      0,
    );

  return (
    <div>
      <h1 className="hk-admin-h1">ססיות</h1>
      <p className="hk-admin-sub">
        {sessions.length} ססיות • הכנסה חודשית ממוצעת:{" "}
        <strong>{formatCurrency(totalMonthlyRevenue)}</strong>
      </p>

      <form className="hk-admin-toolbar" action="/admin/sessions" method="get">
        <select name="status" defaultValue={params.status ?? "פעיל"}>
          <option value="פעיל">פעילות</option>
          <option value="לא פעיל">לא פעילות</option>
          <option value="">כל הסטטוסים</option>
        </select>
        <select name="day" defaultValue={params.day ?? ""}>
          <option value="">כל הימים</option>
          {DAYS.map((d) => (
            <option key={d} value={d}>
              יום {d}
            </option>
          ))}
        </select>
        <button type="submit" className="hk-btn hk-btn--primary">
          סנן
        </button>
        {(params.status || params.day) && (
          <Link href="/admin/sessions" className="hk-btn hk-btn--ghost">
            נקה
          </Link>
        )}
      </form>

      <div className="hk-table-wrap">
        <table className="hk-table">
          <thead>
            <tr>
              <th scope="col">סטטוס</th>
              <th scope="col">לקוח</th>
              <th scope="col">יום</th>
              <th scope="col">שעות</th>
              <th scope="col">חדר</th>
              <th scope="col">שעות בחודש</th>
              <th scope="col">מחיר לפני</th>
              <th scope="col">מחיר אחרי</th>
              <th scope="col">תאריך התחלה</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--ink-muted)",
                  }}
                >
                  לא נמצאו ססיות
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className={statusPill(s.status)}>
                      {s.status ?? "—"}
                    </span>
                  </td>
                  <td>
                    {s.customer_id && s.customer_name ? (
                      <Link href={`/admin/customers/${s.customer_id}`}>
                        {s.customer_name}
                      </Link>
                    ) : (
                      "—"
                    )}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
