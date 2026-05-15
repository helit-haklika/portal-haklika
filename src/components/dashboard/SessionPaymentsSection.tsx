"use client";

import { useState } from "react";
import { ReceiptIcon } from "@/components/shared/Icons";
import { ExportToolbar } from "@/components/shared/ExportButton";
import { ShowMoreButton } from "@/components/shared/ShowMoreButton";
import type { SessionPayment } from "@/types";

const INITIAL_ROWS = 5;

interface Props {
  payments: SessionPayment[];
}

export function SessionPaymentsSection({ payments }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visiblePayments = expanded ? payments : payments.slice(0, INITIAL_ROWS);
  const hiddenCount = payments.length - INITIAL_ROWS;
  const csvData = payments.map((p) => ({
    תאריך: p.date,
    יום: p.dayOfWeek,
    סכום: p.amountPaid,
  }));

  return (
    <section className="hk-section">
      <div className="hk-section__head">
        <div className="hk-section__title">תשלומי ססיה</div>
        <div className="hk-section__count">{payments.length} רשומות</div>
      </div>
      <div className="hk-list">
        <ExportToolbar
          label={`${payments.length} תשלומים`}
          data={csvData}
          csvFilename="תשלומי-ססיה.csv"
        />
        <table className="hk-table">
          <thead>
            <tr>
              <th className="hk-table__th-day">תאריך</th>
              <th className="hk-table__th-desc">תיאור</th>
              <th className="hk-table__th-num">סכום</th>
              <th className="hk-table__th-invoice">חשבונית</th>
            </tr>
          </thead>
          <tbody>
            {visiblePayments.map((p) => (
              <tr key={p.id}>
                <td className="hk-table__td-day">
                  <div className="hk-row__date hk-num">{p.date}</div>
                  <div className="hk-row__dow">{p.dayOfWeek}</div>
                </td>
                <td className="hk-table__td-desc">הוראת קבע · ססיה</td>
                <td className="hk-table__td-num hk-num">{p.amountPaid}</td>
                <td className="hk-table__td-invoice">
                  {p.invoiceUrl && (
                    <a
                      className="hk-row__invoice"
                      href={p.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="צפייה בחשבונית"
                    >
                      <ReceiptIcon />
                    </a>
                  )}
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
