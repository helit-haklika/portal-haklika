"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [error, setError] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;

    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          router.replace("/dashboard");
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "הלינק פג תוקף. בקשו לינק חדש.");
        }
      })
      .catch(() => setError("שגיאת תקשורת. נסו שוב."));
  }, [token, router]);

  if (error) {
    return (
      <div className="hk-auth-card" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--danger)", marginBottom: 20 }}>{error}</p>
        <a
          href="/login"
          className="hk-btn hk-btn--ghost"
          style={{ display: "inline-block" }}
        >
          חזרה לכניסה
        </a>
      </div>
    );
  }

  return (
    <div className="hk-auth-card" style={{ textAlign: "center" }}>
      <p style={{ color: "var(--ink-muted)" }}>מאמת...</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
