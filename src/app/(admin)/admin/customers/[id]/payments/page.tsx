import { getCustomerPayments } from "@/lib/admin/queries";

interface Props {
  params: Promise<{ id: string }>;
}

function formatCurrency(amount?: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return `₪${amount.toLocaleString("he-IL")}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function statusPill(status: string | null): string {
  if (!status) return "hk-pill hk-pill--neutral";
  if (status === "שולם") return "hk-pill hk-pill--active";
  if (status === "ממתין") return "hk-pill hk-pill--pending";
  if (status === "בוטל" || status === "לא שולם")
    return "hk-pill hk-pill--inactive";
  return "hk-pill hk-pill--neutral";
}

export default async function CustomerPayments({ params }: Props) {
  const { id } = await params;
  const payments = await getCustomerPayments(id);

  const totalPaid = payments
    .filter((p) => p.status === "שולם")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div>
      <p style={{ color: "var(--ink-muted)", marginBottom: 16 }}>
        {payments.length} תשלומים • סה״כ שולם:{" "}
        <strong>{formatCurrency(totalPaid)}</strong>
      </p>

      {payments.length === 0 ? (
        <p>אין תשלומים</p>
      ) : (
        <table className="hk-table">
          <thead>
            <tr>
              <th scope="col">תאריך</th>
              <th scope="col">סוג</th>
              <th scope="col">אמצעי</th>
              <th scope="col">סטטוס</th>
              <th scope="col">סכום</th>
              <th scope="col">שעות</th>
              <th scope="col">אסמכתא</th>
              <th scope="col">חשבונית</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{formatDate(p.payment_date)}</td>
                <td>{p.payment_type ?? "—"}</td>
                <td>{p.payment_method ?? "—"}</td>
                <td>
                  <span className={statusPill(p.status)}>
                    {p.status ?? "—"}
                  </span>
                </td>
                <td className="hk-num">{formatCurrency(p.amount)}</td>
                <td className="hk-num">{p.hours_purchased ?? "—"}</td>
                <td>{p.reference_number ?? "—"}</td>
                <td>
                  {p.invoice_url ? (
                    <a href={p.invoice_url} target="_blank" rel="noopener">
                      קישור
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
