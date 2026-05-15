import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  countLabel?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  subtitle,
  countLabel,
  defaultOpen = true,
  children,
}: Props) {
  return (
    <section className="hk-section">
      <details className="hk-collapsible" open={defaultOpen}>
        <summary className="hk-collapsible__head">
          <div className="hk-collapsible__title-wrap">
            <div className="hk-section__title">{title}</div>
            {subtitle && <div className="hk-section__subtitle">{subtitle}</div>}
          </div>
          <div className="hk-collapsible__meta">
            {countLabel && (
              <div className="hk-section__count">{countLabel}</div>
            )}
            <svg
              className="hk-collapsible__chevron"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </summary>
        <div className="hk-collapsible__body">{children}</div>
      </details>
    </section>
  );
}
