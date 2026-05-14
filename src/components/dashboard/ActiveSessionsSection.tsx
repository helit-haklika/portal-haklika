import type { ActiveSession } from "@/types";

interface Props {
  sessions: ActiveSession[];
}

export function ActiveSessionsSection({ sessions }: Props) {
  return (
    <section className="hk-section">
      <div className="hk-section__head">
        <div className="hk-section__title">הססיות שלי</div>
        <div className="hk-section__count">{sessions.length} פעילות</div>
      </div>
      <div className="hk-list">
        {sessions.map((s) => (
          <div key={s.id} className="hk-row">
            <div className="hk-row__lead">
              <div className="hk-row__date">{s.dayOfWeek}</div>
              <div className="hk-row__dow">שבועי</div>
            </div>
            <div className="hk-row__body">
              <div className="hk-row__main">{s.roomName}</div>
              <div className="hk-row__meta">
                <span className="hk-num">
                  {s.startTime}–{s.endTime}
                </span>
                <span className="hk-row__meta-sep" />
                <span>פעיל</span>
              </div>
            </div>
            <div className="hk-row__trail">
              <div className="hk-row__value hk-num">
                {s.basePriceBeforeDiscount}
              </div>
              <div className="hk-row__sub">מחיר בסיס</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
