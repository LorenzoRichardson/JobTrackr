// src/components/TimelinePanel.jsx
export default function TimelinePanel({ events }) {
  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <h2>Upcoming Deadlines & Interviews</h2>
      <div className="panel-subtitle">
        Based on OA due dates and interview dates in your applications.
      </div>

      {!events || events.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 12 }}>
          No upcoming events. Add OA due dates or interview dates to your
          applications to see them here.
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            marginTop: 12,
          }}
        >
          {events.map((ev) => (
            <li
              key={ev.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  minWidth: 95,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {ev.dateStr}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {ev.type} · {ev.company}
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: '#4b5563',
                  }}
                >
                  {ev.role}
                  {ev.status && ` · Current status: ${ev.status}`}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
