// src/App.jsx
import { useEffect, useMemo, useState } from 'react';
import ApplicationFilters from './components/ApplicationFilters';
import ApplicationForm from './components/ApplicationForm';
import ApplicationList from './components/ApplicationList';
import EmailSimulator from './components/EmailSimulator';
import AnalyticsPanel from './components/AnalyticsPanel';
import TimelinePanel from './components/TimelinePanel';
import NotesPanel from './components/NotesPanel';
import NotesPreview from './components/NotesPreview';

export default function App() {
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({ status: '', query: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [notesRefreshKey, setNotesRefreshKey] = useState(0);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Load applications
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/applications');
        const data = await res.json();
        setApplications(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load applications:', err);
        setLoadError('Failed to load applications from server.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filters
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (filters.status && app.status !== filters.status) return false;
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const text = `${app.company_name} ${app.role_title}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [applications, filters]);

  const selectedApplication =
    applications.find((a) => a.id === selectedId) || null;

  // Analytics
  const analytics = useMemo(() => {
    const total = applications.length;
    const byStatus = {};
    const perMonth = {};

    for (const app of applications) {
      const status = app.status || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;

      if (app.applied_date) {
        const key = String(app.applied_date).slice(0, 7);
        perMonth[key] = (perMonth[key] || 0) + 1;
      }
    }

    return {
      total,
      byStatus,
      offers: byStatus['Offer'] || 0,
      interviews: byStatus['Interview'] || 0,
      applied: byStatus['Applied'] || 0,
      rejections: byStatus['Rejected'] || 0,
      perMonth,
    };
  }, [applications]);

  // Timeline
  const upcomingEvents = useMemo(() => {
    const events = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pushEvent = (app, dateValue, type) => {
      if (!dateValue) return;
      const d = new Date(dateValue);
      if (Number.isNaN(d.getTime())) return;

      const normalized = new Date(d);
      normalized.setHours(0, 0, 0, 0);
      if (normalized < today) return;

      events.push({
        id: `${app.id}-${type}`,
        date: normalized,
        dateStr: String(dateValue).slice(0, 10),
        type,
        company: app.company_name,
        role: app.role_title,
        status: app.status,
      });
    };

    for (const app of applications) {
      pushEvent(app, app.oa_due_date, 'OA Due');
      pushEvent(app, app.next_interview_date, 'Interview');
    }

    events.sort((a, b) => a.date - b.date);

    return events;
  }, [applications]);

  // CRUD save
  const handleSaveApplication = async (form) => {
    setSaving(true);
    try {
      if (selectedApplication) {
        const res = await fetch(`/api/applications/${selectedApplication.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setApplications((prev) =>
          prev.map((app) => (app.id === updated.id ? updated : app))
        );
        setToast({ type: 'success', message: 'Application updated.' });
      } else {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setApplications((prev) => [created, ...prev]);
        setSelectedId(created.id);
        setToast({ type: 'success', message: 'Application created.' });
      }
    } catch (err) {
      console.error('Save application failed:', err);
      setToast({
        type: 'error',
        message: 'Failed to save application. See console.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (selectedId === id) setSelectedId(null);
      setToast({ type: 'success', message: 'Application deleted.' });
    } catch (err) {
      console.error('Delete application failed:', err);
      setToast({
        type: 'error',
        message: 'Failed to delete application.',
      });
    }
  };

  const handleSelect = (id) => setSelectedId(id);
  const handleClearSelection = () => setSelectedId(null);

  const handleNewApplication = () => {
    setSelectedId(null);
    setEditorOpen(true);
  };

  // Email → DB update
  const handleEmailStatus = async (result) => {
    const { company_guess, status, note } = result || {};
    if (!status || !company_guess) return;

    try {
      const res = await fetch('/api/applications/email-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_guess, status, note }),
      });

      if (!res.ok) {
        console.error('Email update failed:', await res.text());
        return;
      }

      const updated = await res.json();

      setApplications((prev) =>
        prev.map((app) => (app.id === updated.id ? updated : app))
      );
      setToast({
        type: 'success',
        message: `Status updated from email (${updated.company_name}).`,
      });

      setNotesRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Email update error:', err);
    }
  };

  const editorButtonLabel = editorOpen
    ? 'Hide Application Editor'
    : selectedApplication
    ? 'Edit Selected Application'
    : 'Add Application';

  return (
    <div className="app-shell">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 50,
            padding: '8px 12px',
            borderRadius: 8,
            background:
              toast.type === 'error' ? '#fee2e2' : 'rgba(15,118,110,0.1)',
            color: toast.type === 'error' ? '#b91c1c' : '#0f766e',
            fontSize: '0.85rem',
            border:
              toast.type === 'error'
                ? '1px solid #fecaca'
                : '1px solid rgba(45,212,191,0.6)',
          }}
        >
          {toast.message}
        </div>
      )}

      <header className="app-header">
        <div>
          <div className="app-title">JobTrackr</div>
          <div className="app-subtitle">
            Internship &amp; job application tracker for busy college students.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleNewApplication}
          >
            + New Application
          </button>

          <button
            type="button"
            className="btn-ghost"
            title="Future: connect email inbox and auto-update statuses"
          >
            Connect Email (Coming Soon)
          </button>

          <div className="app-badge">
            CS360 Prototype · Full Stack + Insights
          </div>
        </div>
      </header>

      {loadError && (
        <div className="panel" style={{ marginBottom: 10 }}>
          <div className="empty-state">{loadError}</div>
        </div>
      )}

      <ApplicationFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="panel">
          <div className="empty-state">Loading applications…</div>
        </div>
      ) : (
        <>
          {/* Top grid: Analytics + Application list */}
          <div className="dashboard-grid">
            <AnalyticsPanel analytics={analytics} />
            <ApplicationList
              applications={filteredApps}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          </div>

          {/* Separate full-width notes preview panel */}
          <NotesPreview
            selectedApplication={selectedApplication}
            refreshKey={notesRefreshKey}
          />

          {/* Timeline ABOVE the editor */}
          <TimelinePanel events={upcomingEvents} />

          {/* Button to open/close the editor */}
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setEditorOpen((open) => !open)}
            >
              {editorButtonLabel}
            </button>
          </div>

          {/* Edit/Add Application + editable notes */}
          {editorOpen && (
            <div style={{ marginTop: 12 }}>
              <ApplicationForm
                selected={selectedApplication}
                onSave={handleSaveApplication}
                onClearSelection={handleClearSelection}
                saving={saving}
              />

              {selectedApplication ? (
                <NotesPanel
                  applicationId={selectedApplication.id}
                  refreshKey={notesRefreshKey}
                  onNoteAdded={() => setNotesRefreshKey((k) => k + 1)}
                />
              ) : (
                <div className="panel" style={{ marginTop: 12 }}>
                  <div className="empty-state">
                    Save the application first to start attaching notes.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email simulator last */}
          <EmailSimulator onEmailStatus={handleEmailStatus} />
        </>
      )}
    </div>
  );
}
