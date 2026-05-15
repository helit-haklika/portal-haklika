import { ExportToolbar } from "@/components/shared/ExportButton";
import type { Booking } from "@/types";

interface Props {
  bookings: Booking[];
}

export function BookingsSection({ bookings }: Props) {
  const csvData = bookings.map((b) => ({
    תאריך: b.date,
    יום: b.dayOfWeek,
    חדר: b.roomName,
    "שעת התחלה": b.startTime,
    "שעת סיום": b.endTime,
    "משך (שעות)": b.durationHours,
    "יתרה לאחר": b.balanceAfter,
  }));

  return (
    <section className="hk-section">
      <div className="hk-section__head">
        <div>
          <div className="hk-section__title">שימושים (Bookings)</div>
          <div className="hk-section__subtitle">
            רשימת הBookings ממערכת סקדה
          </div>
        </div>
        <div className="hk-section__count">{bookings.length} רשומות</div>
      </div>
      <div className="hk-list">
        <ExportToolbar
          label={`${bookings.length} שימושים`}
          data={csvData}
          csvFilename="שימושים.csv"
        />
        <div className="hk-table-head">
          <span>יום</span>
          <span>שעות</span>
          <span>חדר</span>
          <span style={{ textAlign: "center" }}>שנוצלו</span>
          <span style={{ textAlign: "center" }}>יתרה לאחר</span>
        </div>
        {bookings.map((b) => (
          <div key={b.id} className="hk-row hk-row--table">
            <div className="hk-row__col-day">
              <div className="hk-row__date hk-num">{b.date}</div>
              <div className="hk-row__dow">{b.dayOfWeek}</div>
            </div>
            <div className="hk-row__col-time">
              <span className="hk-num" dir="ltr">
                {b.startTime}-{b.endTime}
              </span>
            </div>
            <div className="hk-row__col-room">{b.roomName}</div>
            <div className="hk-row__col-hours hk-num">{b.durationHours}</div>
            <div className="hk-row__col-balance hk-num">{b.balanceAfter}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
