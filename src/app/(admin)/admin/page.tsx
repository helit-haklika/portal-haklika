import Link from "next/link";
import {
  getDashboardKpis,
  getNegativeBalanceCustomers,
} from "@/lib/admin/queries";

function formatCurrency(amount: number): string {
  return `₪${amount.toLocaleString("he-IL")}`;
}

export default async function AdminDashboard() {
  const [kpis, negative] = await Promise.all([
    getDashboardKpis(),
    getNegativeBalanceCustomers(10),
  ]);

  const monthLabel = new Date().toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <h1 className="hk-admin-h1">דשבורד</h1>
      <p className="hk-admin-sub">תמונת מצב כללית • {monthLabel}</p>

      <h3
        style={{
          marginBottom: 10,
          fontSize: 14,
          color: "var(--ink-muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        לקוחות
      </h3>
      <div className="hk-kpi-grid">
        <KpiCard
          label="סה״כ לקוחות"
          value={String(kpis.totalCustomers)}
          href="/admin/customers"
        />
        <KpiCard
          label="פעילים"
          value={String(kpis.activeCustomers)}
          href={`/admin/customers?status=${encodeURIComponent("פעיל")}`}
        />
        <KpiCard
          label="לא פעילים"
          value={String(kpis.inactiveCustomers)}
          href={`/admin/customers?status=${encodeURIComponent("לא פעיל")}`}
        />
        <KpiCard label="חדשים החודש" value={String(kpis.newThisMonth)} />
      </div>

      <h3
        style={{
          marginTop: 24,
          marginBottom: 10,
          fontSize: 14,
          color: "var(--ink-muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        פעילות חודשית
      </h3>
      <div className="hk-kpi-grid">
        <KpiCard
          label="הכנסות החודש"
          value={formatCurrency(kpis.monthRevenue)}
        />
        <KpiCard label="שימושים החודש" value={String(kpis.bookingsThisMonth)} />
        <KpiCard
          label="ססיות פעילות"
          value={String(kpis.activeSessionsCount)}
        />
      </div>

      <h3
        style={{
          marginTop: 24,
          marginBottom: 10,
          fontSize: 14,
          color: "var(--ink-muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        טיפול נדרש
      </h3>
      <div className="hk-kpi-grid">
        <KpiCard
          label="יתרה במינוס"
          value={String(kpis.negativeBalanceCount)}
          danger={kpis.negativeBalanceCount > 0}
        />
        <KpiCard label="משימות פתוחות" value={String(kpis.pendingTasksCount)} />
        <KpiCard label="לידים פתוחים" value={String(kpis.openLeadsCount)} />
      </div>

      {negative.length > 0 && (
        <>
          <h3 style={{ marginTop: 32, marginBottom: 12, fontSize: 16 }}>
            לקוחות ביתרה שלילית
          </h3>
          <div className="hk-table-wrap">
            <table className="hk-table">
              <thead>
                <tr>
                  <th scope="col">שם</th>
                  <th scope="col">יתרת שעות</th>
                </tr>
              </thead>
              <tbody>
                {negative.map((c) => {
                  const name =
                    [c.first_name, c.last_name]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || "(ללא שם)";
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/admin/customers/${c.id}`}>{name}</Link>
                      </td>
                      <td
                        className="hk-num"
                        style={{ color: "var(--danger)", fontWeight: 600 }}
                      >
                        {c.balance_hours.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  danger,
  href,
}: {
  label: string;
  value: string;
  danger?: boolean;
  href?: string;
}) {
  const inner = (
    <div className="hk-kpi-card" style={href ? { cursor: "pointer" } : {}}>
      <div className="label">{label}</div>
      <div className={`value ${danger ? "value--danger" : ""}`}>{value}</div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
