// src/components/ApplicationList.jsx
import ApplicationNotes from './ApplicationNotes';

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
        <div className="empty-state">
          No applications yet. Use the form on the left to add your first one.
        </div>
      ) : (
        <>
          <table className="app-list-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Type</th>
                <th>Applied</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className={
                    'app-row' + (app.id === selectedId ? ' selected' : '')
                  }
                  onClick={() => onSelect(app.id)}
                >
                  <td>{app.company_name}</td>
                  <td>{app.role_title}</td>
                  <td>
                    <span className="status-pill">{app.status}</span>
                  </td>
                  <td>{app.role_type || '-'}</td>
                  <td>{app.applied_date || '-'}</td>
                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    style={{ textAlign: 'right' }}
                  >
                    <button
                      className="btn-danger"
                      style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete application for ${app.company_name}?`
                          )
                        ) {
                          onDelete(app.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedId && (
            <ApplicationNotes
              application={applications.find((a) => a.id === selectedId)}
            />
          )}
        </>
      )}
    </div>
  );
}
