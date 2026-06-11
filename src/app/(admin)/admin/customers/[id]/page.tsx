import {
  getCustomer,
  getCustomerBalance,
  getCustomerPayments,
  getCustomerBookings,
  getCustomerSessions,
} from "@/lib/admin/queries";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

function formatCurrency(amount?: number | null): string {
  if (!amount) return "₪0";
  return `₪${amount.toLocaleString("he-IL")}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default async function CustomerOverview({ params }: Props) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const [balance, payments, bookings, sessions] = await Promise.all([
    getCustomerBalance(id),
    getCustomerPayments(id),
    getCustomerBookings(id, 5),
    getCustomerSessions(id),
  ]);

  // Compute summary metrics
  const totalPaid = payments
    .filter((p) => p.status === "שולם")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  const totalHoursPurchased = payments
    .filter((p) => p.payment_type === "כרטיסיה" && p.status === "שולם")
    .reduce((s, p) => s + (p.hours_purchased ?? 0), 0);

  const lastBooking = bookings[0];
  const activeSessions = sessions.filter((s) => s.status === "פעיל");

  return (
    <div>
      <div className="hk-kpi-grid">
        <KpiCard
          label="יתרת שעות"
          value={balance.toFixed(2)}
          danger={balance < 0}
        />
        <KpiCard label="ססיות פעילות" value={String(activeSessions.length)} />
        <KpiCard label="סה״כ שולם" value={formatCurrency(totalPaid)} />
        <KpiCard
          label="שעות שנרכשו (כרטיסיה)"
          value={totalHoursPurchased.toFixed(2)}
        />
        <KpiCard
          label="סה״כ שימושים"
          value={String(bookings.length === 5 ? "200+" : bookings.length)}
        />
        <KpiCard label="שימוש אחרון" value={formatDate(lastBooking?.date)} />
      </div>

      <h3
        style={{
          marginTop: 24,
          marginBottom: 12,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        ססיות פעילות
      </h3>
      {activeSessions.length === 0 ? (
        <p style={{ color: "var(--ink-muted)" }}>אין ססיות פעילות</p>
      ) : (
        <ul style={{ paddingInlineStart: 20, margin: 0 }}>
          {activeSessions.map((s) => (
            <li key={s.id} style={{ marginBottom: 6 }}>
              {s.day_of_week} {s.start_time}–{s.end_time}
              {s.room_name && ` • ${s.room_name}`}
              {s.price_after_discount &&
                ` • ${formatCurrency(s.price_after_discount)}/חודש`}
            </li>
          ))}
        </ul>
      )}

      <h3
        style={{
          marginTop: 24,
          marginBottom: 12,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        5 שימושים אחרונים
      </h3>
      {bookings.length === 0 ? (
        <p style={{ color: "var(--ink-muted)" }}>אין שימושים</p>
      ) : (
        <table className="hk-table" style={{ background: "#fafafa" }}>
          <thead>
            <tr>
              <th scope="col">תאריך</th>
              <th scope="col">חדר</th>
              <th scope="col">סוג</th>
              <th scope="col">משך</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{formatDate(b.date)}</td>
                <td>{b.room_name ?? "—"}</td>
                <td>{b.booking_title ?? "—"}</td>
                <td className="hk-num">
                  {b.duration_hours
                    ? `${b.duration_hours.toFixed(2)} שעות`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="hk-kpi-card">
      <div className="label">{label}</div>
      <div className={`value ${danger ? "value--danger" : ""}`}>{value}</div>
    </div>
  );
}
