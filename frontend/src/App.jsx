// src/App.jsx
import { useEffect, useMemo, useState } from 'react';
import ApplicationFilters from './components/ApplicationFilters';
import ApplicationForm from './components/ApplicationForm';
import ApplicationList from './components/ApplicationList';
import EmailSimulator from './components/EmailSimulator';

export default function App() {
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({ status: '', query: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Load applications from backend on mount
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

  const handleSaveApplication = async (form) => {
    try {
      if (selectedApplication) {
        // UPDATE
        const res = await fetch(`/api/applications/${selectedApplication.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setApplications((prev) =>
          prev.map((app) => (app.id === updated.id ? updated : app))
        );
      } else {
        // CREATE
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setApplications((prev) => [created, ...prev]);
        setSelectedId(created.id);
      }
    } catch (err) {
      console.error('Save application failed:', err);
      alert('Failed to save application. Check console for details.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Delete application failed:', err);
      alert('Failed to delete application.');
    }
  };

  const handleSelect = (id) => {
    setSelectedId(id);
  };

  const handleClearSelection = () => {
    setSelectedId(null);
  };

  const handleNewApplication = () => {
    setSelectedId(null);
  };

  // 🔴 NEW: email simulator now calls backend to persist status + note
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

      // Update local state so dashboard reflects DB
      setApplications((prev) =>
        prev.map((app) => (app.id === updated.id ? updated : app))
      );
    } catch (err) {
      console.error('Email update error:', err);
    }
  };

  return (
    <div className="app-shell">
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

          <div className="app-badge">CS360 Prototype · Full Stack</div>
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
        <div className="dashboard-grid">
          <ApplicationForm
            selected={selectedApplication}
            onSave={handleSaveApplication}
            onClearSelection={handleClearSelection}
          />

          <ApplicationList
            applications={filteredApps}
            selectedId={selectedId}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        </div>
      )}

      <EmailSimulator onEmailStatus={handleEmailStatus} />
    </div>
  );
}
