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

  return <div className="hk-page">{children}</div>;
}
