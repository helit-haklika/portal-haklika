"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/shared/Icons";

interface HeaderProps {
  name: string;
  yesterdayDate: string;
}

export function Header({ name, yesterdayDate }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="hk-header">
      <Image
        src="/logo.png"
        alt="הקליקה"
        width={48}
        height={48}
        className="hk-header__logo"
        priority
      />
      <div className="hk-header__title">
        <h1 className="hk-header__brand">דף מידע אישי - הקליקה</h1>
        <div className="hk-header__name">{name}</div>
        <div className="hk-header__meta hk-header__meta--lg">
          <span className="hk-header__dot" />
          <span>
            נתונים עדכניים החל מ <span dir="ltr">1.1.25</span> ומעודכן עד ל{" "}
            <strong dir="ltr">{yesterdayDate}</strong>
          </span>
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
