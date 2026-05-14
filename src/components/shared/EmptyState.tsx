import { EmptyIcon, WarnIcon } from "./Icons";

interface EmptyStateProps {
  variant?: "default" | "danger";
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function EmptyState({
  variant = "default",
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div className="hk-empty">
      <div
        className={`hk-empty__icon${variant === "danger" ? " hk-empty__icon--danger" : ""}`}
      >
        {variant === "danger" ? (
          <WarnIcon width={34} height={34} />
        ) : (
          <EmptyIcon />
        )}
      </div>
      <div className="hk-empty__title">{title}</div>
      <div className="hk-empty__sub">{subtitle}</div>
      {action}
    </div>
  );
}
