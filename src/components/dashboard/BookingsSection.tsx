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
        <table className="hk-table">
          <thead>
            <tr>
              <th className="hk-table__th-day">יום</th>
              <th className="hk-table__th-time">שעות</th>
              <th className="hk-table__th-room">חדר</th>
              <th className="hk-table__th-num">סך שעות</th>
              <th className="hk-table__th-num">יתרה לאחר שימוש</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="hk-table__td-day">
                  <div className="hk-row__date hk-num">{b.date}</div>
                  <div className="hk-row__dow">{b.dayOfWeek}</div>
                </td>
                <td className="hk-table__td-time">
                  <span className="hk-num" dir="ltr">
                    {b.startTime}-{b.endTime}
                  </span>
                </td>
                <td className="hk-table__td-room">{b.roomName}</td>
                <td className="hk-table__td-num hk-num">
                  {Math.abs(b.durationHours)}
                </td>
                <td className="hk-table__td-num hk-num">{b.balanceAfter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
