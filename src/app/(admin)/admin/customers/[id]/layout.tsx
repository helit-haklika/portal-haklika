import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/admin/queries";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

const TABS = [
  { href: "", label: "סקירה" },
  { href: "payments", label: "תשלומים" },
  { href: "bookings", label: "שימושים" },
  { href: "sessions", label: "ססיות" },
  { href: "details", label: "פרטים מלאים" },
  { href: "edit", label: "עריכה ✏️" },
];

function statusPill(status: string | null): string {
  if (!status) return "hk-pill hk-pill--neutral";
  if (status === "פעיל") return "hk-pill hk-pill--active";
  if (status === "לא פעיל") return "hk-pill hk-pill--inactive";
  if (status === "חדש") return "hk-pill hk-pill--new";
  if (status.includes("נשלח") || status.includes("ממתין"))
    return "hk-pill hk-pill--pending";
  return "hk-pill hk-pill--neutral";
}

export default async function CustomerLayout({ children, params }: Props) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const fullName =
    [customer.first_name, customer.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || "(ללא שם)";

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/admin/customers"
          style={{ color: "var(--ink-muted)", fontSize: 14 }}
        >
          ← חזרה לרשימת לקוחות
        </Link>
      </div>

      <div className="hk-customer-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1>{fullName}</h1>
            <div className="hk-meta">
              {customer.status && (
                <span className={statusPill(customer.status)}>
                  {customer.status}
                </span>
              )}
              {customer.email && <span>📧 {customer.email}</span>}
              {customer.phone && <span dir="ltr">📱 {customer.phone}</span>}
              {customer.compound_name && (
                <span>📍 {customer.compound_name}</span>
              )}
              {customer.payment_type && <span>💳 {customer.payment_type}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {customer.phone && (
              <a
                href={`https://wa.me/${customer.phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noopener"
                className="hk-btn hk-btn--ghost"
              >
                📱 WhatsApp
              </a>
            )}
            <Link
              href={`/admin/customers/${id}/new-task`}
              className="hk-btn hk-btn--ghost"
            >
              ➕ משימה חדשה
            </Link>
          </div>
        </div>
      </div>

      <nav className="hk-customer-tabs">
        {TABS.map((tab) => {
          const href = tab.href
            ? `/admin/customers/${id}/${tab.href}`
            : `/admin/customers/${id}`;
          return (
            <Link key={tab.href} href={href}>
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="hk-tab-content">{children}</div>
    </div>
  );
}
