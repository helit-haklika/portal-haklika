import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { WhatsAppFab } from "@/components/dashboard/WhatsAppFab";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    console.error("Dashboard layout: no session, redirecting to login");
    redirect("/login");
  }
  console.log("Dashboard layout: session found for", session.email);

  const phoneNumber = process.env.HAKLIKA_WHATSAPP_NUMBER ?? "";
  // We don't have the name here — WhatsApp message will be generic; the page itself renders with name
  return (
    <div className="hk-page">
      {children}
      <WhatsAppFab phoneNumber={phoneNumber} customerName="לקוח" />
    </div>
  );
}
