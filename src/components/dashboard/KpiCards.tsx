import { ClockIcon, WalletIcon, WarnIcon } from "@/components/shared/Icons";

interface KpiHeroProps {
  value: string;
  unit?: string;
  label?: string;
  sub?: string;
  variant?: "default" | "danger";
}

export function KpiHero({
  value,
  unit = "שעות",
  label = "יתרת שעות בכרטיסייה",
  sub,
  variant = "default",
}: KpiHeroProps) {
  if (variant === "danger") {
    return (
      <div className="hk-kpi hk-kpi--danger">
        <div className="hk-kpi__label">
          <WarnIcon width={14} height={14} /> יתרת שעות בכרטיסייה
        </div>
        <div className="hk-kpi__value hk-num">
          {value}
          <span className="hk-kpi__unit">{unit}</span>
        </div>
        <div className="hk-kpi__sub">
          {sub ?? "היתרה במינוס. כדאי לרכוש כרטיסייה חדשה."}
        </div>
      </div>
    );
  }
  return (
    <div className="hk-kpi hk-kpi--hero">
      <div className="hk-kpi__label">
        <ClockIcon /> {label}
      </div>
      <div className="hk-kpi__value hk-num">
        {value}
        <span className="hk-kpi__unit">{unit}</span>
      </div>
      {sub && <div className="hk-kpi__sub">{sub}</div>}
    </div>
  );
}

interface KpiSmallProps {
  icon: "clock" | "wallet";
  label: string;
  value: string;
  unit: string;
  sub?: string;
}

export function KpiSmall({ icon, label, value, unit, sub }: KpiSmallProps) {
  return (
    <div className="hk-kpi">
      <div className="hk-kpi__label">
        {icon === "clock" ? <ClockIcon /> : <WalletIcon />} {label}
      </div>
      <div className="hk-kpi__value hk-num">
        {value}
        <span className="hk-kpi__unit">{unit}</span>
      </div>
      {sub && <div className="hk-kpi__sub">{sub}</div>}
    </div>
  );
}

interface NegativeAlertProps {
  hoursOverdrawn: number;
}

export function NegativeBalanceAlert({ hoursOverdrawn }: NegativeAlertProps) {
  return (
    <div className="hk-alert">
      <WarnIcon width={18} height={18} />
      <div>
        <div className="hk-alert__title">היתרה שלך במינוס</div>
        <div className="hk-alert__sub">
          ניצלת {hoursOverdrawn} שעות מעבר ליתרה. רכוש כרטיסייה חדשה למטה כדי
          לאזן.
        </div>
      </div>
    </div>
  );
}
