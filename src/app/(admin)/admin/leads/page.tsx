import Link from "next/link";
import {
  listLeads,
  listLeadStatuses,
  listLeadSources,
} from "@/lib/admin/queries";

interface SearchParams {
  q?: string;
  status?: string;
  source?: string;
  source_table?: string;
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
  if (status.includes("חדש") || status.includes("פניה"))
    return "hk-pill hk-pill--new";
  if (status === "רלוונטי" || status === "ממתין למענה")
    return "hk-pill hk-pill--pending";
  if (status === "נסגר" || status === "לקוח") return "hk-pill hk-pill--active";
  if (status.includes("לא רלוונטי") || status.includes("מאוכזב"))
    return "hk-pill hk-pill--inactive";
  return "hk-pill hk-pill--neutral";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [leads, statuses, sources] = await Promise.all([
    listLeads({
      search: params.q,
      status: params.status,
      source: params.source,
      sourceTable: params.source_table,
    }),
    listLeadStatuses(),
    listLeadSources(),
  ]);

  return (
    <div>
      <h1 className="hk-admin-h1">לידים</h1>
      <p className="hk-admin-sub">{leads.length} לידים</p>

      <form className="hk-admin-toolbar" action="/admin/leads" method="get">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="חיפוש לפי שם / אימייל / טלפון..."
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
        <select name="source" defaultValue={params.source ?? ""}>
          <option value="">כל המקורות</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="source_table" defaultValue={params.source_table ?? ""}>
          <option value="">כל הטבלאות</option>
          <option value="leads">לידים</option>
          <option value="haklika_talk">HAKLIKA TALK</option>
          <option value="dreamlab">dreamlab</option>
        </select>
        <button type="submit" className="hk-btn hk-btn--primary">
          סנן
        </button>
        {(params.q ||
          params.status ||
          params.source ||
          params.source_table) && (
          <Link href="/admin/leads" className="hk-btn hk-btn--ghost">
            נקה
          </Link>
        )}
      </form>

      <div className="hk-table-wrap">
        <table className="hk-table">
          <thead>
            <tr>
              <th scope="col">שם</th>
              <th scope="col">טלפון</th>
              <th scope="col">אימייל</th>
              <th scope="col">סטטוס</th>
              <th scope="col">מקור</th>
              <th scope="col">סוג טיפול</th>
              <th scope="col">סוג השכרה</th>
              <th scope="col">פגישה</th>
              <th scope="col">נוצר</th>
              <th scope="col">הומר ל</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--ink-muted)",
                  }}
                >
                  לא נמצאו לידים
                </td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id}>
                  <td>{l.name ?? "—"}</td>
                  <td className="hk-num">{l.phone ?? "—"}</td>
                  <td>{l.email ?? "—"}</td>
                  <td>
                    <span className={statusPill(l.status)}>
                      {l.status ?? "—"}
                    </span>
                  </td>
                  <td>{l.source ?? "—"}</td>
                  <td>{l.treatment_type ?? "—"}</td>
                  <td>{l.rental_type ?? "—"}</td>
                  <td>{formatDate(l.meeting_at)}</td>
                  <td>{formatDate(l.airtable_created_at)}</td>
                  <td>
                    {l.converted_to_customer_id ? (
                      <Link
                        href={`/admin/customers/${l.converted_to_customer_id}`}
                      >
                        לקוח →
                      </Link>
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
