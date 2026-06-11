import Link from "next/link";
import { listTasks, listTaskStatuses } from "@/lib/admin/queries";

interface SearchParams {
  status?: string;
  view?: "open" | "all";
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
  if (!status) return "hk-pill hk-pill--pending";
  if (status === "בוצע") return "hk-pill hk-pill--active";
  if (status === "תקוע") return "hk-pill hk-pill--inactive";
  if (status === "לטיפול") return "hk-pill hk-pill--new";
  if (status === "בטיפול") return "hk-pill hk-pill--pending";
  return "hk-pill hk-pill--neutral";
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view = params.view ?? "open";
  const [tasks, statuses] = await Promise.all([
    listTasks({
      status: params.status,
      onlyOpen: view === "open" && !params.status,
    }),
    listTaskStatuses(),
  ]);

  return (
    <div>
      <h1 className="hk-admin-h1">משימות והתראות</h1>
      <p className="hk-admin-sub">{tasks.length} משימות</p>

      <form className="hk-admin-toolbar" action="/admin/tasks" method="get">
        <select name="view" defaultValue={view}>
          <option value="open">פתוחות בלבד</option>
          <option value="all">כולן</option>
        </select>
        <select name="status" defaultValue={params.status ?? ""}>
          <option value="">כל הסטטוסים</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="hk-btn hk-btn--primary">
          סנן
        </button>
        {(params.status || view !== "open") && (
          <Link href="/admin/tasks" className="hk-btn hk-btn--ghost">
            נקה
          </Link>
        )}
      </form>

      <div className="hk-table-wrap">
        <table className="hk-table">
          <thead>
            <tr>
              <th scope="col">משימה</th>
              <th scope="col">סטטוס</th>
              <th scope="col">לקוח</th>
              <th scope="col">הערות</th>
              <th scope="col">נוצר</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--ink-muted)",
                  }}
                >
                  אין משימות פתוחות 🎉
                </td>
              </tr>
            ) : (
              tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title ?? "—"}</td>
                  <td>
                    <span className={statusPill(t.status)}>
                      {t.status ?? "לטיפול"}
                    </span>
                  </td>
                  <td>
                    {t.customer_id && t.customer_name ? (
                      <Link href={`/admin/customers/${t.customer_id}`}>
                        {t.customer_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ maxWidth: 300, whiteSpace: "normal" }}>
                    {t.notes ?? "—"}
                  </td>
                  <td>{formatDate(t.airtable_created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
