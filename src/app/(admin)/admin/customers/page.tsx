import Link from "next/link";
import {
  listCustomers,
  listDistinctStatuses,
  listDistinctPaymentTypes,
  listDistinctCompounds,
  type CustomerListRow,
} from "@/lib/admin/queries";

interface SearchParams {
  q?: string;
  status?: string;
  payment_type?: string;
  compound?: string;
}

function statusPill(status: string | null): string {
  if (!status) return "hk-pill hk-pill--neutral";
  if (status === "פעיל") return "hk-pill hk-pill--active";
  if (status === "לא פעיל") return "hk-pill hk-pill--inactive";
  if (status === "חדש" || status === "ליד") return "hk-pill hk-pill--new";
  if (status.includes("נשלח") || status.includes("ממתין"))
    return "hk-pill hk-pill--pending";
  return "hk-pill hk-pill--neutral";
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default async function CustomersListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = {
    search: params.q,
    status: params.status,
    paymentType: params.payment_type,
    compound: params.compound,
  };

  const [customers, statuses, paymentTypes, compounds] = await Promise.all([
    listCustomers(filters),
    listDistinctStatuses(),
    listDistinctPaymentTypes(),
    listDistinctCompounds(),
  ]);

  return (
    <div>
      <h1 className="hk-admin-h1">לקוחות</h1>
      <p className="hk-admin-sub">{customers.length} לקוחות</p>

      <form className="hk-admin-toolbar" action="/admin/customers" method="get">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="חיפוש לפי שם, אימייל או טלפון..."
          autoComplete="off"
        />
        <select name="status" defaultValue={params.status ?? ""}>
          <option value="">כל הסטטוסים</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="payment_type" defaultValue={params.payment_type ?? ""}>
          <option value="">כל סוגי התשלום</option>
          {paymentTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="compound" defaultValue={params.compound ?? ""}>
          <option value="">כל המתחמים</option>
          {compounds.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="submit" className="hk-btn hk-btn--primary">
          סנן
        </button>
        {(params.q ||
          params.status ||
          params.payment_type ||
          params.compound) && (
          <Link href="/admin/customers" className="hk-btn hk-btn--ghost">
            נקה
          </Link>
        )}
      </form>

      <div className="hk-table-wrap">
        <table className="hk-table">
          <thead>
            <tr>
              <th scope="col">שם</th>
              <th scope="col">אימייל</th>
              <th scope="col">טלפון</th>
              <th scope="col">סטטוס</th>
              <th scope="col">סוג תשלום</th>
              <th scope="col">מתחם</th>
              <th scope="col">תאריך התחלה</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--ink-muted)",
                  }}
                >
                  לא נמצאו לקוחות בסינון הנוכחי
                </td>
              </tr>
            ) : (
              customers.map((c) => <CustomerRow key={c.id} c={c} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerRow({ c }: { c: CustomerListRow }) {
  const fullName =
    [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "(ללא שם)";
  return (
    <tr onClick={undefined} style={{ cursor: "pointer" }}>
      <td>
        <Link href={`/admin/customers/${c.id}`}>{fullName}</Link>
      </td>
      <td>{c.email ?? "—"}</td>
      <td className="hk-num">{c.phone ?? "—"}</td>
      <td>
        <span className={statusPill(c.status)}>{c.status ?? "—"}</span>
      </td>
      <td>{c.payment_type ?? "—"}</td>
      <td>{c.compound_name ?? "—"}</td>
      <td className="hk-num">{formatDate(c.start_date)}</td>
    </tr>
  );
}
