// src/components/ApplicationList.jsx

export default function ApplicationList({
  applications,
  selectedId,
  onSelect,
  onDelete,
}) {
  return (
    <div className="panel">
      <h2>Applications</h2>
      <div className="panel-subtitle">
        Centralized view of all internships and jobs you&apos;re tracking.
      </div>

      {applications.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 12 }}>
          No applications yet. Click &quot;+ New Application&quot; to add one.
        </div>
      ) : (
        <div className="table-wrapper" style={{ marginTop: 12 }}>
          <table className="app-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Type</th>
                <th>Applied</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const isSelected = app.id === selectedId;

                return (
                  <tr
                    key={app.id}
                    className={isSelected ? 'row-selected' : ''}
                    onClick={() => onSelect(app.id)}
                  >
                    <td>{app.company_name}</td>
                    <td>{app.role_title}</td>
                    <td>
                      <span
                        className={`status-pill status-${app.status || ''}`}
                      >
                        {app.status || '—'}
                      </span>
                    </td>
                    <td>{app.role_type || '—'}</td>
                    <td>
                      {app.applied_date
                        ? String(app.applied_date).slice(0, 10)
                        : '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost danger"
                        onClick={(e) => {
                          e.stopPropagation(); // don’t change selection on delete
                          onDelete(app.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
