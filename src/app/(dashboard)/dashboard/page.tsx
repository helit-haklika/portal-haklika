import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getCachedDashboard, setCachedDashboard } from "@/lib/cache/kv";
import {
  fetchCustomer,
  fetchPunchCardPayments,
  fetchBookings,
  fetchActiveSessions,
  fetchSessionTransactions,
  fetchSessionPayments,
} from "@/lib/airtable/queries";
import { Header } from "@/components/dashboard/Header";
import {
  KpiHero,
  KpiSmall,
  NegativeBalanceAlert,
} from "@/components/dashboard/KpiCards";
import { PurchaseSection } from "@/components/dashboard/PurchaseSection";
import { BookingsSection } from "@/components/dashboard/BookingsSection";
import { ActiveSessionsSection } from "@/components/dashboard/ActiveSessionsSection";
import { RecurringPaymentSummary } from "@/components/dashboard/RecurringPaymentSummary";
import { SessionPaymentsSection } from "@/components/dashboard/SessionPaymentsSection";
import { Footer } from "@/components/dashboard/Footer";
import { EmptyState } from "@/components/shared/EmptyState";
import type { DashboardData } from "@/types";

function getUpdatedRange(): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const d = yesterday.getDate();
  const m = yesterday.getMonth() + 1;
  const y = String(yesterday.getFullYear()).slice(-2);
  return `1/1/25 – ${d}/${m}/${y}`;
}

function getPurchaseLinks() {
  try {
    const raw = process.env.PUNCH_CARD_PURCHASE_LINKS;
    if (raw)
      return JSON.parse(raw) as { label: string; url: string; sub?: string }[];
  } catch {}
  return [];
}

async function fetchDashboardData(
  customerId: string,
): Promise<DashboardData | null> {
  const cached = await getCachedDashboard(customerId);
  if (cached) {
    try {
      return JSON.parse(cached as string) as DashboardData;
    } catch {}
  }

  const customer = await fetchCustomer(customerId);
  if (!customer) return null;

  const [
    punchCardPayments,
    bookings,
    activeSessions,
    sessionTransactions,
    sessionPayments,
  ] = await Promise.all([
    fetchPunchCardPayments(customerId),
    fetchBookings(customerId),
    fetchActiveSessions(customerId),
    fetchSessionTransactions(customerId),
    fetchSessionPayments(customerId),
  ]);

  const data: DashboardData = {
    customer,
    punchCardPayments,
    bookings,
    activeSessions,
    sessionTransactions,
    sessionPayments,
  };

  await setCachedDashboard(customerId, data);
  return data;
}

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  let data: DashboardData | null = null;
  try {
    data = await fetchDashboardData(session.customerId);
  } catch (err) {
    console.error("Dashboard fetch error:", err);
  }

  if (!data) {
    return (
      <div>
        <EmptyState
          variant="danger"
          title="לא הצלחנו לטעון את הנתונים"
          subtitle="משהו השתבש בהתחברות למערכת. נסו לרענן את הדף, ואם הבעיה חוזרת - צרו איתנו קשר."
        />
      </div>
    );
  }

  const {
    customer,
    punchCardPayments,
    bookings,
    activeSessions,
    sessionTransactions,
    sessionPayments,
  } = data;
  const hasPunchCardData = punchCardPayments.length > 0 || bookings.length > 0;
  const hasSessionData = activeSessions.length > 0;
  const balance = customer.balance;
  const isNegative = balance < 0;
  const hoursThisMonth = bookings
    .filter((b) => b.isCurrentMonth)
    .reduce((s, b) => s + b.durationHours, 0);
  const monthlyRecurring = sessionTransactions.reduce(
    (s, t) => s + t.priceAfterDiscount,
    0,
  );
  const updatedRange = getUpdatedRange();
  const purchaseLinks = getPurchaseLinks();

  if (!hasPunchCardData && !hasSessionData) {
    return (
      <div>
        <Header name={customer.name} updatedRange={updatedRange} />
        <EmptyState
          title="עוד אין לכם פעילות בפורטל"
          subtitle="ברגע שתרכשו את הכרטיסייה הראשונה או תפתחו ססיה, הנתונים יופיעו כאן."
        />
        <Footer
          purchaseLinks={purchaseLinks}
          updateDetailsUrl={customer.updateFormUrl}
        />
      </div>
    );
  }

  return (
    <div>
      <Header name={customer.name} updatedRange={updatedRange} />

      {hasPunchCardData && (
        <section className="hk-section hk-section--tight">
          <div
            className={`hk-kpis ${hasSessionData ? "hk-kpis--2" : "hk-kpis--1"}`}
          >
            <KpiHero
              value={balance.toString()}
              variant={isNegative ? "danger" : "default"}
            />
            <KpiSmall
              icon="clock"
              label="שימושים החודש"
              value={hoursThisMonth.toString()}
              unit="שעות"
            />
            {hasSessionData && (
              <KpiSmall
                icon="wallet"
                label="הוראת קבע חודשית"
                value={monthlyRecurring.toLocaleString("he-IL")}
                unit="₪"
              />
            )}
          </div>
          {isNegative && (
            <NegativeBalanceAlert hoursOverdrawn={Math.abs(balance)} />
          )}
        </section>
      )}

      {!hasPunchCardData && hasSessionData && (
        <section className="hk-section hk-section--tight">
          <div className="hk-kpis hk-kpis--1">
            <KpiSmall
              icon="wallet"
              label="הוראת קבע חודשית"
              value={monthlyRecurring.toLocaleString("he-IL")}
              unit="₪"
              sub={`מחושב מ-${activeSessions.length} ססיות פעילות בשבוע`}
            />
          </div>
        </section>
      )}

      {hasPunchCardData && <PurchaseSection payments={punchCardPayments} />}
      {hasPunchCardData && <BookingsSection bookings={bookings} />}
      {hasSessionData && <ActiveSessionsSection sessions={activeSessions} />}
      {hasSessionData && (
        <RecurringPaymentSummary
          totalMonthly={monthlyRecurring}
          sessionCount={activeSessions.length}
        />
      )}
      {hasSessionData && <SessionPaymentsSection payments={sessionPayments} />}

      <Footer
        purchaseLinks={purchaseLinks}
        updateDetailsUrl={customer.updateFormUrl}
      />
    </div>
  );
}
