import { ReceiptIcon } from "@/components/shared/Icons";
import { ExportToolbar } from "@/components/shared/ExportButton";
import type { SessionPayment } from "@/types";

interface Props {
  payments: SessionPayment[];
}

export function SessionPaymentsSection({ payments }: Props) {
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
        {payments.map((p) => (
          <div key={p.id} className="hk-row">
            <div className="hk-row__lead">
              <div className="hk-row__date hk-num">{p.date}</div>
              <div className="hk-row__dow">{p.dayOfWeek}</div>
            </div>
            <div className="hk-row__body">
              <div className="hk-row__main">הוראת קבע · ססיה</div>
              <div className="hk-row__meta">
                <span>שולם</span>
              </div>
            </div>
            <div className="hk-row__trail">
              <div className="hk-row__value hk-num">{p.amountPaid}</div>
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
