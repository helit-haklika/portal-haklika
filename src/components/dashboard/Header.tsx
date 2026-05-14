"use client";

import { useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/shared/Icons";

interface HeaderProps {
  name: string;
  updatedRange: string;
}

export function Header({ name, updatedRange }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="hk-header">
      <div className="hk-header__title">
        <div className="hk-header__hello">שלום,</div>
        <div className="hk-header__name">{name}</div>
        <div className="hk-header__meta">
          <span className="hk-header__dot" />
          <span>נתונים עדכניים: {updatedRange}</span>
        </div>
      </div>
      <button
        className="hk-iconbtn"
        aria-label="התנתקות"
        onClick={handleLogout}
      >
        <LogoutIcon />
      </button>
    </header>
  );
}
