import { ReceiptIcon } from "@/components/shared/Icons";
import { ExportToolbar } from "@/components/shared/ExportButton";
import type { PunchCardPayment } from "@/types";

interface Props {
  payments: PunchCardPayment[];
}

export function PurchaseSection({ payments }: Props) {
  const totalHours = payments.reduce((s, p) => s + p.hours, 0);
  const csvData = payments.map((p) => ({
    תאריך: p.date,
    יום: p.dayOfWeek,
    שעות: p.hours,
    סכום: p.amountPaid,
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
        <div className="hk-payments-head">
          <span className="hk-payments-head__invoice">חשבונית</span>
        </div>
        {payments.map((p) => (
          <div key={p.id} className="hk-row">
            <div className="hk-row__lead">
              <div className="hk-row__date hk-num">{p.date}</div>
              <div className="hk-row__dow">{p.dayOfWeek}</div>
            </div>
            <div className="hk-row__body">
              <div className="hk-row__main">כרטיסיית {p.hours} שעות</div>
              <div className="hk-row__meta">
                <span>שולם</span>
                <span className="hk-row__meta-sep" />
                <span className="hk-num">{p.amountPaid}</span>
              </div>
            </div>
            <div className="hk-row__trail">
              <div className="hk-row__value hk-num">{p.hours}</div>
              <div className="hk-row__sub">שעות</div>
            </div>
            {p.invoiceUrl && (
              <a
                className="hk-row__invoice"
                href={p.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="חשבונית"
              >
                <ReceiptIcon />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
