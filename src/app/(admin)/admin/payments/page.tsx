import Link from "next/link";
import { listPayments } from "@/lib/admin/queries";

interface SearchParams {
  type?: string;
  status?: string;
  from?: string;
  to?: string;
}

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
  if (status === "שולם") return "hk-pill hk-pill--active";
  if (status === "ממתין") return "hk-pill hk-pill--pending";
  if (status === "בוטל" || status === "לא שולם")
    return "hk-pill hk-pill--inactive";
  return "hk-pill hk-pill--neutral";
}

const PAYMENT_TYPES = ["כרטיסיה", "ססיה", "שעת שימוש", "סדנא", "אחר"];
const PAYMENT_STATUSES = ["שולם", "ממתין", "בוטל", "לא שולם"];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const payments = await listPayments({
    type: params.type,
    status: params.status,
    from: params.from,
    to: params.to,
    limit: 300,
  });

  const total = payments
    .filter((p) => p.status === "שולם")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div>
      <h1 className="hk-admin-h1">תשלומים</h1>
      <p className="hk-admin-sub">
        {payments.length} תשלומים • שולם:{" "}
        <strong>{formatCurrency(total)}</strong>
      </p>

      <form className="hk-admin-toolbar" action="/admin/payments" method="get">
        <select name="type" defaultValue={params.type ?? ""}>
          <option value="">כל הסוגים</option>
          {PAYMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={params.status ?? ""}>
          <option value="">כל הסטטוסים</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={params.from ?? ""}
          placeholder="מתאריך"
        />
        <input
          type="date"
          name="to"
          defaultValue={params.to ?? ""}
          placeholder="עד תאריך"
        />
        <button type="submit" className="hk-btn hk-btn--primary">
          סנן
        </button>
        {(params.type || params.status || params.from || params.to) && (
          <Link href="/admin/payments" className="hk-btn hk-btn--ghost">
            נקה
          </Link>
        )}
      </form>

      <div className="hk-table-wrap">
        <table className="hk-table">
          <thead>
            <tr>
              <th scope="col">תאריך</th>
              <th scope="col">לקוח</th>
              <th scope="col">סוג</th>
              <th scope="col">אמצעי</th>
              <th scope="col">סטטוס</th>
              <th scope="col">סכום</th>
              <th scope="col">שעות</th>
              <th scope="col">אסמכתא</th>
              <th scope="col">חשבונית</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--ink-muted)",
                  }}
                >
                  לא נמצאו תשלומים
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.payment_date)}</td>
                  <td>
                    {p.customer_id && p.customer_name ? (
                      <Link href={`/admin/customers/${p.customer_id}`}>
                        {p.customer_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{p.payment_type ?? "—"}</td>
                  <td>{p.payment_method ?? "—"}</td>
                  <td>
                    <span className={statusPill(p.status)}>
                      {p.status ?? "—"}
                    </span>
                  </td>
                  <td className="hk-num">{formatCurrency(p.amount)}</td>
                  <td className="hk-num">{p.hours_purchased ?? "—"}</td>
                  <td>{p.reference_number ?? "—"}</td>
                  <td>
                    {p.invoice_url ? (
                      <a href={p.invoice_url} target="_blank" rel="noopener">
                        קישור
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
