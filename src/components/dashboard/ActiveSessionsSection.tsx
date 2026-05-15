"use client";

import { useState } from "react";
import { ShowMoreButton } from "@/components/shared/ShowMoreButton";
import type { ActiveSession } from "@/types";

const INITIAL_ROWS = 5;

interface Props {
  sessions: ActiveSession[];
}

export function ActiveSessionsSection({ sessions }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visibleSessions = expanded ? sessions : sessions.slice(0, INITIAL_ROWS);
  const hiddenCount = sessions.length - INITIAL_ROWS;

  return (
    <section className="hk-section">
      <div className="hk-section__head">
        <div className="hk-section__title">הססיות שלי</div>
        <div className="hk-section__count">{sessions.length} פעילות</div>
      </div>
      <div className="hk-list">
        <table className="hk-table">
          <thead>
            <tr>
              <th className="hk-table__th-day">יום</th>
              <th className="hk-table__th-time">שעות</th>
              <th className="hk-table__th-room">חדר</th>
              <th className="hk-table__th-num">מחיר בסיס</th>
              <th className="hk-table__th-status">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {visibleSessions.map((s) => (
              <tr key={s.id}>
                <td className="hk-table__td-day">
                  <div className="hk-row__date">{s.dayOfWeek}</div>
                  <div className="hk-row__dow">שבועי</div>
                </td>
                <td className="hk-table__td-time">
                  <span className="hk-num" dir="ltr">
                    {s.startTime}-{s.endTime}
                  </span>
                </td>
                <td className="hk-table__td-room">{s.roomName}</td>
                <td className="hk-table__td-num hk-num">
                  {s.basePriceBeforeDiscount}
                </td>
                <td className="hk-table__td-status">
                  <span className="hk-pill hk-pill--success">פעיל</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ShowMoreButton
          expanded={expanded}
          hiddenCount={hiddenCount}
          onToggle={() => setExpanded((v) => !v)}
        />
      </div>
    </section>
  );
}
