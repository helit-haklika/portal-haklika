import Link from "next/link";
import { listBookingsForRange } from "@/lib/admin/queries";

interface SearchParams {
  week?: string; // YYYY-MM-DD = the Sunday that starts the week
}

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Hebrew calendar starts on Sunday (day 0)
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
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

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const today = new Date();
  const weekStart = params.week
    ? startOfWeek(new Date(params.week))
    : startOfWeek(today);
  const weekEnd = addDays(weekStart, 7);

  const bookings = await listBookingsForRange(
    toIsoDate(weekStart),
    toIsoDate(weekEnd),
  );

  // Group bookings by date
  const byDay = new Map<string, typeof bookings>();
  for (let i = 0; i < 7; i++) {
    byDay.set(toIsoDate(addDays(weekStart, i)), []);
  }
  for (const b of bookings) {
    if (!b.date) continue;
    const arr = byDay.get(b.date);
    if (arr) arr.push(b);
  }

  const prevWeek = toIsoDate(addDays(weekStart, -7));
  const nextWeek = toIsoDate(addDays(weekStart, 7));
  const thisWeek = toIsoDate(startOfWeek(today));

  const totalCount = bookings.length;
  const totalHours = bookings.reduce((s, b) => s + (b.duration_hours ?? 0), 0);

  return (
    <div>
      <h1 className="hk-admin-h1">לוח שבועי</h1>
      <p className="hk-admin-sub">
        {formatDateLabel(weekStart)} – {formatDateLabel(addDays(weekStart, 6))}{" "}
        • {totalCount} שימושים • {totalHours.toFixed(1)} שעות
      </p>

      <div className="hk-admin-toolbar">
        <Link
          href={`/admin/calendar?week=${prevWeek}`}
          className="hk-btn hk-btn--ghost"
        >
          ← שבוע קודם
        </Link>
        <Link
          href={`/admin/calendar?week=${thisWeek}`}
          className="hk-btn hk-btn--ghost"
        >
          השבוע
        </Link>
        <Link
          href={`/admin/calendar?week=${nextWeek}`}
          className="hk-btn hk-btn--ghost"
        >
          שבוע הבא →
        </Link>
      </div>

      <div className="hk-week-grid">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = addDays(weekStart, i);
          const dayIso = toIsoDate(day);
          const dayBookings = byDay.get(dayIso) ?? [];
          const isToday = dayIso === toIsoDate(today);
          return (
            <div
              key={dayIso}
              className={`hk-week-day ${isToday ? "is-today" : ""}`}
            >
              <div className="hk-week-day-header">
                <div className="hk-week-day-name">{DAYS_HE[i]}</div>
                <div className="hk-week-day-date">{formatDateLabel(day)}</div>
                <div className="hk-week-day-count">{dayBookings.length}</div>
              </div>
              <div className="hk-week-day-events">
                {dayBookings.length === 0 ? (
                  <div className="hk-week-day-empty">—</div>
                ) : (
                  dayBookings.map((b) => (
                    <Link
                      key={b.id}
                      href={
                        b.customer_id
                          ? `/admin/customers/${b.customer_id}`
                          : "#"
                      }
                      className="hk-week-event"
                    >
                      <div className="hk-week-event-time">
                        {formatTime(b.start_at)}–{formatTime(b.end_at)}
                      </div>
                      <div className="hk-week-event-name">
                        {b.customer_name ?? "(ללא לקוח)"}
                      </div>
                      <div className="hk-week-event-room">
                        {b.room_name ?? ""}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
