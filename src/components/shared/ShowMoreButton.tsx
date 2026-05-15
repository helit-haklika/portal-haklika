"use client";

interface Props {
  expanded: boolean;
  hiddenCount: number;
  onToggle: () => void;
}

export function ShowMoreButton({ expanded, hiddenCount, onToggle }: Props) {
  if (hiddenCount <= 0) return null;
  return (
    <button
      type="button"
      className="hk-show-more"
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <span>{expanded ? "הצג פחות" : `הצג עוד ${hiddenCount} שורות`}</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
