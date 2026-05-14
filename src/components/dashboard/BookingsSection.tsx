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
        <div className="hk-section__title">שימושים (Bookings)</div>
        <div className="hk-section__count">{bookings.length} רשומות</div>
      </div>
      <div className="hk-list">
        <ExportToolbar
          label={`${bookings.length} שימושים`}
          data={csvData}
          csvFilename="שימושים.csv"
        />
        {bookings.map((b) => (
          <div key={b.id} className="hk-row">
            <div className="hk-row__lead">
              <div className="hk-row__date hk-num">{b.date}</div>
              <div className="hk-row__dow">{b.dayOfWeek}</div>
            </div>
            <div className="hk-row__body">
              <div className="hk-row__main">{b.roomName}</div>
              <div className="hk-row__meta">
                <span className="hk-num">
                  {b.startTime}–{b.endTime}
                </span>
                <span className="hk-row__meta-sep" />
                <span className="hk-num">{b.durationHours} ש׳</span>
              </div>
            </div>
            <div className="hk-row__trail">
              <div className="hk-row__sub">יתרה לאחר</div>
              <div className="hk-row__value hk-num">{b.balanceAfter}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
