// Hebrew loading skeleton for the customer dashboard.
// Shown while the server fetches dashboard data (5-6 parallel queries).
export default function DashboardLoading() {
  return (
    <div className="hk-page" aria-busy="true" aria-label="טוען נתונים">
      <div style={{ padding: "20px 20px 0" }}>
        <div className="hk-skel" style={{ height: 28, width: "55%" }} />
        <div
          className="hk-skel"
          style={{ height: 14, width: "35%", marginTop: 10 }}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: 20,
        }}
      >
        <div className="hk-skel" style={{ height: 96, borderRadius: 16 }} />
        <div className="hk-skel" style={{ height: 96, borderRadius: 16 }} />
        <div className="hk-skel" style={{ height: 96, borderRadius: 16 }} />
        <div className="hk-skel" style={{ height: 96, borderRadius: 16 }} />
      </div>
      <div style={{ padding: "0 20px", display: "grid", gap: 10 }}>
        <div className="hk-skel" style={{ height: 64, borderRadius: 14 }} />
        <div className="hk-skel" style={{ height: 64, borderRadius: 14 }} />
        <div className="hk-skel" style={{ height: 64, borderRadius: 14 }} />
      </div>
      <p
        style={{
          textAlign: "center",
          padding: 24,
          fontSize: 14,
          color: "var(--ink-muted)",
        }}
      >
        טוענים את הנתונים שלך...
      </p>
    </div>
  );
}
