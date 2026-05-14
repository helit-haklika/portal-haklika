interface Props {
  totalMonthly: number;
  sessionCount: number;
}

export function RecurringPaymentSummary({ totalMonthly, sessionCount }: Props) {
  return (
    <div className="hk-section" style={{ paddingTop: 10 }}>
      <div className="hk-bigstat">
        <div>
          <div className="hk-bigstat__label">סכום להוראת קבע</div>
          <div className="hk-bigstat__sub">
            מחושב מ-{sessionCount} ססיות פעילות
          </div>
        </div>
        <div className="hk-bigstat__value hk-num">
          ₪{totalMonthly.toLocaleString("he-IL")}
          <span className="hk-bigstat__value-unit">/חודש</span>
        </div>
      </div>
    </div>
  );
}
