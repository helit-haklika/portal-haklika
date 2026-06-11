import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/dashboard");

  return (
    <div className="hk-admin">
      <nav className="hk-admin-nav">
        <Link href="/admin" className="hk-admin-brand">
          הקליקה
        </Link>
        <div className="hk-admin-links">
          <Link href="/admin">דשבורד</Link>
          <Link href="/admin/customers">לקוחות</Link>
          <Link href="/admin/leads">לידים</Link>
          <Link href="/admin/payments">תשלומים</Link>
          <Link href="/admin/bookings">שימושים</Link>
          <Link href="/admin/calendar">לוח</Link>
          <Link href="/admin/sessions">ססיות</Link>
          <Link href="/admin/tasks">משימות</Link>
          <Link href="/admin/logs">לוגים</Link>
        </div>
        <div className="hk-admin-user">
          <span>{session.email}</span>
          <Link href="/dashboard">חזרה לפורטל</Link>
        </div>
      </nav>
      <main className="hk-admin-main">{children}</main>
    </div>
  );
}
