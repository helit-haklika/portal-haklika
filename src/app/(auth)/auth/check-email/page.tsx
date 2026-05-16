"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Image from "next/image";

function MailIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 7l9 6 9-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12a9 9 0 0 1 15.5-6.3M21 12a9 9 0 0 1-15.5 6.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19 3v4h-4M5 21v-4h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    try {
      await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="hk-auth">
      <div className="hk-auth__brand">
        <Image
          src="/logo.png"
          alt="HAKLIKA"
          width={160}
          height={100}
          className="hk-logo"
          priority
        />
        <div className="hk-brand-name">אזור אישי</div>
      </div>
      <div className="hk-check">
        <div className="hk-check__icon">
          <MailIcon />
        </div>
        <div className="hk-auth__title">בדקו את תיבת הדואר</div>
        <div className="hk-auth__sub" style={{ maxWidth: 300 }}>
          אם הכתובת רשומה במערכת, שלחנו לכם לינק כניסה. הוא יישאר תקף ל-15 דקות.
        </div>
        {email && (
          <div className="hk-check__email-box">
            <MailIcon />
            {email}
          </div>
        )}
      </div>
      <div style={{ padding: "0 0 16px" }}>
        <button
          className="hk-btn hk-btn--ghost"
          onClick={handleResend}
          disabled={resending || resent}
        >
          <RefreshIcon />
          {resent ? "נשלח!" : resending ? "שולח..." : "שליחה חוזרת"}
        </button>
      </div>
      <div className="hk-auth__help">
        המייל לא הגיע? בדקו בתיקיית הספאם
        <br />
        או <a href="/login">חזרה לכניסה</a>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="hk-auth" />}>
      <CheckEmailContent />
    </Suspense>
  );
}
