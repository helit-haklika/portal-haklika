import Link from "next/link";
import {
  readLogs,
  readMetrics,
  type LoginEntry,
  type RequestLinkEntry,
  type ErrorEntry,
} from "@/lib/logs";

type Range = "1" | "7" | "30";

function parseRange(value: string | undefined): Range {
  if (value === "1" || value === "7" || value === "30") return value;
  return "7";
}

function formatTs(ts: number): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ts));
}

const OUTCOME_LABELS: Record<RequestLinkEntry["outcome"], string> = {
  sent: "נשלח",
  "not-found": "לא נמצא",
  inactive: "לקוח לא פעיל",
  "rate-limited": "חסום זמנית",
  error: "שגיאה",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const days = parseInt(range, 10);

  const [metrics, logins, requests, errors] = await Promise.all([
    readMetrics(days),
    readLogs<LoginEntry>("log:login", days, 50),
    readLogs<RequestLinkEntry>("log:request", days, 50),
    readLogs<ErrorEntry>("log:error", days, 50),
  ]);

  return (
    <div>
      <header className="hk-header" style={{ paddingBlock: 16 }}>
        <div className="hk-header__title">
          <h1 className="hk-header__brand">אדמין הקליקה</h1>
          <div className="hk-header__meta">
            <span>
              נתונים מ-
              {days === 1
                ? "היום"
                : days === 7
                  ? "השבוע האחרון"
                  : "30 הימים האחרונים"}
            </span>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          {(["1", "7", "30"] as Range[]).map((r) => (
            <Link
              key={r}
              href={`/admin?range=${r}`}
              className="hk-iconbtn"
              style={{
                fontSize: 13,
                padding: "6px 12px",
                width: "auto",
                height: "auto",
                background: r === range ? "var(--primary)" : undefined,
                color: r === range ? "white" : undefined,
              }}
            >
              {r === "1" ? "היום" : `${r} ימים`}
            </Link>
          ))}
        </nav>
      </header>

      <section className="hk-section">
        <div
          className="hk-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <MetricCard label="כניסות" value={metrics.loginsTotal} />
          <MetricCard label="לקוחות ייחודיים" value={metrics.activeCustomers} />
          <MetricCard
            label="שגיאות"
            value={errors.length}
            danger={errors.length > 0}
          />
          <MetricCard
            label="בקשות שכשלו"
            value={requests.filter((r) => r.outcome !== "sent").length}
            danger={requests.some((r) => r.outcome === "error")}
          />
        </div>
      </section>

      <section className="hk-section">
        <div className="hk-section__head">
          <div>
            <div className="hk-section__title">כניסות אחרונות</div>
            <div className="hk-section__subtitle">{logins.length} רשומות</div>
          </div>
        </div>
        <div className="hk-list">
          {logins.length === 0 ? (
            <div style={{ padding: 16, color: "var(--ink-muted)" }}>
              אין כניסות בטווח זה
            </div>
          ) : (
            <table className="hk-table">
              <thead>
                <tr>
                  <th scope="col" className="hk-table__th-time">זמן</th>
                  <th scope="col">שם</th>
                  <th scope="col">אימייל</th>
                </tr>
              </thead>
              <tbody>
                {logins.map((l, i) => (
                  <tr key={i}>
                    <td className="hk-table__td-time hk-num" dir="ltr">
                      {formatTs(l.ts)}
                    </td>
                    <td>{l.name || (l.isAdmin ? "אדמין" : "—")}</td>
                    <td
                      dir="ltr"
                      style={{
                        textAlign: "right",
                        fontSize: 12.5,
                        color: "var(--ink-muted)",
                      }}
                    >
                      {l.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="hk-section">
        <div className="hk-section__head">
          <div>
            <div className="hk-section__title">בקשות לינק</div>
            <div className="hk-section__subtitle">{requests.length} רשומות</div>
          </div>
        </div>
        <div className="hk-list">
          {requests.length === 0 ? (
            <div style={{ padding: 16, color: "var(--ink-muted)" }}>
              אין בקשות בטווח זה
            </div>
          ) : (
            <table className="hk-table">
              <thead>
                <tr>
                  <th scope="col" className="hk-table__th-time">זמן</th>
                  <th scope="col">אימייל</th>
                  <th scope="col">סטטוס</th>
                  <th scope="col">סיבה</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr
                    key={i}
                    style={{
                      background:
                        r.outcome === "error"
                          ? "rgba(184,74,62,0.06)"
                          : undefined,
                    }}
                  >
                    <td className="hk-table__td-time hk-num" dir="ltr">
                      {formatTs(r.ts)}
                    </td>
                    <td
                      dir="ltr"
                      style={{ textAlign: "right", fontSize: 12.5 }}
                    >
                      {r.email}
                    </td>
                    <td
                      style={{
                        fontWeight: r.outcome !== "sent" ? 600 : 400,
                        color:
                          r.outcome === "sent"
                            ? "var(--primary)"
                            : r.outcome === "error"
                              ? "var(--danger)"
                              : "var(--ink-muted)",
                      }}
                    >
                      {OUTCOME_LABELS[r.outcome]}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                      {r.reason ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="hk-section">
        <div className="hk-section__head">
          <div>
            <div className="hk-section__title">שגיאות מערכת</div>
            <div className="hk-section__subtitle">{errors.length} רשומות</div>
          </div>
        </div>
        <div className="hk-list">
          {errors.length === 0 ? (
            <div style={{ padding: 16, color: "var(--ink-muted)" }}>
              אין שגיאות בטווח זה ✓
            </div>
          ) : (
            <table className="hk-table">
              <thead>
                <tr>
                  <th scope="col" className="hk-table__th-time">זמן</th>
                  <th scope="col">מקור</th>
                  <th scope="col">הודעה</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((e, i) => (
                  <tr key={i}>
                    <td className="hk-table__td-time hk-num" dir="ltr">
                      {formatTs(e.ts)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{e.source}</td>
                    <td
                      style={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        direction: "ltr",
                        textAlign: "right",
                      }}
                    >
                      {e.message}
                      {e.context && Object.keys(e.context).length > 0 && (
                        <div
                          style={{ marginTop: 4, color: "var(--ink-muted)" }}
                        >
                          {JSON.stringify(e.context)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className="hk-kpi"
      style={{
        padding: 16,
        background: "var(--surface)",
        borderRadius: 16,
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 4 }}>
        {label}
      </div>
      <div
        className="hk-num"
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: danger ? "var(--danger)" : "var(--ink)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
