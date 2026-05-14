"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "שגיאה. נסו שוב.");
        return;
      }
      router.push(
        `/auth/check-email?email=${encodeURIComponent(email.trim())}`,
      );
    } catch {
      setError("שגיאת רשת. בדקו את החיבור ונסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hk-auth">
      <div className="hk-auth__brand">
        <Image
          src="/logo.jpg"
          alt="HAKLIKA"
          width={160}
          height={100}
          className="hk-logo"
          priority
        />
        <div className="hk-brand-name">פורטל לקוחות</div>
      </div>
      <div className="hk-auth__head">
        <div className="hk-auth__title">ברוכים הבאים</div>
        <div className="hk-auth__sub">
          הכניסו את כתובת האימייל שלכם ונשלח לכם לינק כניסה. ללא סיסמה.
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="hk-field">
          <label className="hk-field__label" htmlFor="email">
            כתובת אימייל
          </label>
          <input
            id="email"
            type="email"
            className="hk-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            required
            disabled={loading}
          />
        </div>
        {error && (
          <div className="text-[var(--danger)] text-sm mb-4 px-1">{error}</div>
        )}
        <button className="hk-btn" type="submit" disabled={loading}>
          {loading ? "שולחים..." : "שלחו לי לינק כניסה"}
        </button>
      </form>
      <div className="hk-auth__help">
        לא זוכרים את האימייל שאיתו נרשמתם?{" "}
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          צרו קשר בוואטסאפ
        </a>
      </div>
      <div className="hk-auth__legal">
        הכניסה לפורטל בטוחה ומוצפנת.
        <br />
        הפרטים שלכם נשמרים אצלנו בלבד.
      </div>
    </div>
  );
}
