import Link from "next/link";
import { listBookings, listRooms } from "@/lib/admin/queries";

interface SearchParams {
  type?: string;
  room?: string;
  from?: string;
  to?: string;
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

const BOOKING_TITLES = ["שעתי", "ססיה", "סדנה/קורס", "paid", "חד פעמי"];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  // Default: this month
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [bookings, rooms] = await Promise.all([
    listBookings({
      bookingTitle: params.type,
      from: params.from ?? monthStart,
      to: params.to,
      roomId: params.room,
      limit: 500,
    }),
    listRooms(),
  ]);

  const totalHours = bookings.reduce((s, b) => s + (b.duration_hours ?? 0), 0);

  return (
    <div>
      <h1 className="hk-admin-h1">שימושים (Bookings)</h1>
      <p className="hk-admin-sub">
        {bookings.length} שימושים • סה״כ שעות:{" "}
        <strong>{totalHours.toFixed(1)}</strong>
      </p>

      <form className="hk-admin-toolbar" action="/admin/bookings" method="get">
        <select name="type" defaultValue={params.type ?? ""}>
          <option value="">כל הסוגים</option>
          {BOOKING_TITLES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="room" defaultValue={params.room ?? ""}>
          <option value="">כל החדרים</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={params.from ?? monthStart}
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
        {(params.type || params.room || params.from || params.to) && (
          <Link href="/admin/bookings" className="hk-btn hk-btn--ghost">
            נקה
          </Link>
        )}
      </form>

      <div className="hk-table-wrap">
        <table className="hk-table">
          <thead>
            <tr>
              <th scope="col">תאריך</th>
              <th scope="col">שעות</th>
              <th scope="col">לקוח</th>
              <th scope="col">חדר</th>
              <th scope="col">סוג</th>
              <th scope="col">משך</th>
              <th scope="col">סטטוס</th>
              <th scope="col">מקור</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "var(--ink-muted)",
                  }}
                >
                  לא נמצאו שימושים
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id}>
                  <td>{formatDate(b.date)}</td>
                  <td className="hk-num">
                    {formatTime(b.start_at)}–{formatTime(b.end_at)}
                  </td>
                  <td>
                    {b.customer_id && b.customer_name ? (
                      <Link href={`/admin/customers/${b.customer_id}`}>
                        {b.customer_name}
                      </Link>
                    ) : (
                      "—"
                    )}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
