import { getCustomerBookings } from "@/lib/admin/queries";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

const TIME_FMT = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : TIME_FMT.format(d);
}

function statusPill(status: string | null): string {
  if (!status) return "hk-pill hk-pill--neutral";
  if (status === "מבוטל") return "hk-pill hk-pill--inactive";
  if (status === "בוצע") return "hk-pill hk-pill--active";
  return "hk-pill hk-pill--neutral";
}

export default async function CustomerBookings({ params }: Props) {
  const { id } = await params;
  const bookings = await getCustomerBookings(id, 500);

  const totalHours = bookings.reduce((s, b) => s + (b.duration_hours ?? 0), 0);

  return (
    <div>
      <p style={{ color: "var(--ink-muted)", marginBottom: 16 }}>
        {bookings.length} שימושים • סה״כ שעות:{" "}
        <strong>{totalHours.toFixed(2)}</strong>
      </p>

      {bookings.length === 0 ? (
        <p>אין שימושים</p>
      ) : (
        <table className="hk-table">
          <thead>
            <tr>
              <th scope="col">תאריך</th>
              <th scope="col">שעות</th>
              <th scope="col">חדר</th>
              <th scope="col">סוג</th>
              <th scope="col">משך</th>
              <th scope="col">סטטוס</th>
              <th scope="col">מקור</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{formatDate(b.date)}</td>
                <td className="hk-num">
                  {formatTime(b.start_at)}–{formatTime(b.end_at)}
                </td>
                <td>{b.room_name ?? "—"}</td>
                <td>{b.booking_title ?? "—"}</td>
                <td className="hk-num">
                  {b.duration_hours ? b.duration_hours.toFixed(2) : "—"}
                </td>
                <td>
                  <span className={statusPill(b.status)}>
                    {b.status ?? "—"}
                  </span>
                </td>
                <td>{b.source ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
