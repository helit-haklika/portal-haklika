"use client";

// Root error boundary - Hebrew, RTL, with a retry button.
// Replaces Next's generic English error screen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="hk-empty" style={{ minHeight: "70dvh" }} role="alert">
      <div className="hk-empty__icon hk-empty__icon--danger" aria-hidden="true">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="hk-empty__title">משהו השתבש</h2>
      <p className="hk-empty__sub">
        לא הצלחנו לטעון את העמוד. אפשר לנסות שוב, ואם זה חוזר - כתבו לנו
        בוואטסאפ ונעזור.
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          marginTop: 8,
          padding: "10px 28px",
          borderRadius: 12,
          border: "none",
          background: "var(--primary)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        נסו שוב
      </button>
      {error.digest ? (
        <div className="hk-error-code">קוד שגיאה: {error.digest}</div>
      ) : null}
    </div>
  );
}
