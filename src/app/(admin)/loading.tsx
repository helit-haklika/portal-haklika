// Hebrew loading skeleton for the admin area.
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="טוען נתונים" style={{ padding: 24 }}>
      <div className="hk-skel" style={{ height: 26, width: 220 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginTop: 20,
        }}
      >
        <div className="hk-skel" style={{ height: 80, borderRadius: 12 }} />
        <div className="hk-skel" style={{ height: 80, borderRadius: 12 }} />
        <div className="hk-skel" style={{ height: 80, borderRadius: 12 }} />
        <div className="hk-skel" style={{ height: 80, borderRadius: 12 }} />
      </div>
      <div style={{ marginTop: 24, display: "grid", gap: 8 }}>
        <div className="hk-skel" style={{ height: 44, borderRadius: 8 }} />
        <div className="hk-skel" style={{ height: 44, borderRadius: 8 }} />
        <div className="hk-skel" style={{ height: 44, borderRadius: 8 }} />
        <div className="hk-skel" style={{ height: 44, borderRadius: 8 }} />
        <div className="hk-skel" style={{ height: 44, borderRadius: 8 }} />
      </div>
      <p
        style={{
          textAlign: "center",
          padding: 24,
          fontSize: 14,
          color: "var(--ink-muted)",
        }}
      >
        טוענים נתונים...
      </p>
    </div>
  );
}
