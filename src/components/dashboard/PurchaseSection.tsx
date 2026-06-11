"use client";

import { useState } from "react";
import { ReceiptIcon } from "@/components/shared/Icons";
import { ExportToolbar } from "@/components/shared/ExportButton";
import { ShowMoreButton } from "@/components/shared/ShowMoreButton";
import type { PunchCardPayment } from "@/types";

const INITIAL_ROWS = 5;

interface Props {
  payments: PunchCardPayment[];
}

export function PurchaseSection({ payments }: Props) {
  const [expanded, setExpanded] = useState(false);
  const totalHours = payments.reduce((s, p) => s + p.hours, 0);
  const visiblePayments = expanded ? payments : payments.slice(0, INITIAL_ROWS);
  const hiddenCount = payments.length - INITIAL_ROWS;
  const csvData = payments.map((p) => ({
    תאריך: p.date,
    יום: p.dayOfWeek,
    שעות: p.hours,
    סכום: p.amountPaid,
    "יתרה לאחר רכישה": p.balanceAfter,
  }));

  return (
    <section className="hk-section">
      <div className="hk-section__head">
        <div className="hk-section__title">כרטיסיות שנרכשו</div>
        <div className="hk-section__count">{payments.length} רשומות</div>
      </div>
      <div className="hk-list">
        <ExportToolbar
          label={`${payments.length} רכישות · ${totalHours} שעות סך הכל`}
          data={csvData}
          csvFilename="רכישות-כרטיסיות.csv"
        />
        <table className="hk-table hk-table--stack">
          <thead>
            <tr>
              <th scope="col" className="hk-table__th-day">תאריך</th>
              <th scope="col" className="hk-table__th-desc">תיאור</th>
              <th scope="col" className="hk-table__th-num">שעות</th>
              <th scope="col" className="hk-table__th-num">סכום</th>
              <th scope="col" className="hk-table__th-num">יתרה לאחר רכישה</th>
              <th scope="col" className="hk-table__th-invoice">חשבונית</th>
            </tr>
          </thead>
          <tbody>
            {visiblePayments.map((p) => (
              <tr key={p.id}>
                <td className="hk-table__td-day">
                  <div className="hk-row__date hk-num">{p.date}</div>
                  <div className="hk-row__dow">{p.dayOfWeek}</div>
                </td>
                <td className="hk-table__td-desc" data-label="תיאור">
                  כרטיסיית {p.hours} שעות
                </td>
                <td className="hk-table__td-num hk-num" data-label="שעות">
                  {p.hours}
                </td>
                <td className="hk-table__td-num hk-num" data-label="סכום">
                  {p.amountPaid}
                </td>
                <td
                  className="hk-table__td-num hk-num"
                  data-label="יתרה לאחר רכישה"
                >
                  {p.balanceAfter}
                </td>
                <td className="hk-table__td-invoice" data-label="חשבונית">
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
