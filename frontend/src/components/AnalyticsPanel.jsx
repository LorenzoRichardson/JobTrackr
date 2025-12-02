// src/components/AnalyticsPanel.jsx

const STATUS_ORDER = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected', 'Saved', 'Unknown'];

const STATUS_COLORS = {
  Applied: '#60a5fa',   // blue
  OA: '#f97316',        // orange
  Interview: '#22c55e', // green
  Offer: '#a855f7',     // purple
  Rejected: '#ef4444',  // red
  Saved: '#9ca3af',     // gray
  Unknown: '#6b7280',   // dark gray
};

export default function AnalyticsPanel({ analytics }) {
  if (!analytics) return null;

  const { total, byStatus, offers, interviews, rejections, applied } = analytics;

  const statusEntries = STATUS_ORDER
    .map((status) => ({
      status,
      count: byStatus[status] || 0,
      color: STATUS_COLORS[status] || STATUS_COLORS.Unknown,
    }))
    .filter((e) => e.count > 0);

  const totalForPie = statusEntries.reduce((sum, e) => sum + e.count, 0);

  // Build conic-gradient string for pie chart
  let currentAngle = 0;
  const gradientParts = statusEntries.map((e) => {
    const sliceAngle = totalForPie ? (e.count / totalForPie) * 360 : 0;
    const start = currentAngle;
    const end = currentAngle + sliceAngle;
    currentAngle = end;
    return `${e.color} ${start}deg ${end}deg`;
  });

  const pieStyle =
    statusEntries.length === 0
      ? { background: '#e5e7eb' }
      : { background: `conic-gradient(${gradientParts.join(', ')})` };

  return (
    <div className="panel">
      <h2>Application Analytics</h2>
      <div className="panel-subtitle">
        Live overview of your application pipeline.
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 12,
        }}
      >
        <KpiCard label="Total Applications" value={total} />
        <KpiCard label="Applied" value={applied} />
        <KpiCard label="Interviews" value={interviews} />
        <KpiCard label="Offers" value={offers} />
        <KpiCard label="Rejections" value={rejections} />
      </div>

      {/* Pie chart + legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginTop: 16,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: '50%',
            border: '1px solid #e5e7eb',
            ...pieStyle,
          }}
        />

        <div>
          {statusEntries.length === 0 ? (
            <div
              style={{
                fontSize: '0.85rem',
                color: '#6b7280',
              }}
            >
              No data yet. Add an application to see the breakdown.
            </div>
          ) : (
            statusEntries.map((e) => (
              <div
                key={e.status}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                  fontSize: '0.85rem',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '999px',
                    background: e.color,
                  }}
                />
                <span style={{ minWidth: 80 }}>{e.status}</span>
                <span style={{ color: '#4b5563' }}>· {e.count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        minWidth: 120,
      }}
    >
      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 600 }}>{value}</div>
    </div>
  );
}
