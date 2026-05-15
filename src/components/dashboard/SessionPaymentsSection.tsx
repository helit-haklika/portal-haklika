import { ReceiptIcon } from "@/components/shared/Icons";
import { ExportToolbar } from "@/components/shared/ExportButton";
import { CollapsibleSection } from "@/components/shared/CollapsibleSection";
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
    <CollapsibleSection
      title="תשלומי ססיה"
      countLabel={`${payments.length} רשומות`}
      defaultOpen={payments.length <= 5}
    >
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
            {payments.map((p) => (
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
      </div>
    </CollapsibleSection>
  );
}
