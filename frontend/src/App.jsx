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
import LoginPanel from './components/LoginPanel';

export default function App() {
  // ======= AUTH STATE =======
  const [auth, setAuth] = useState({
    user: null,
    token: null,
    checking: true,
  });

  // ======= APP DATA STATE =======
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({ status: '', query: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [loadingApps, setLoadingApps] = useState(false);
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

  // Helper to build auth headers
  const authHeaders = auth.token
    ? { Authorization: `Bearer ${auth.token}` }
    : {};

  // ======= CHECK EXISTING SESSION ON LOAD =======
  useEffect(() => {
    async function checkSession() {
      try {
        const saved = localStorage.getItem('jobtrackr_auth');
        if (!saved) {
          setAuth({ user: null, token: null, checking: false });
          return;
        }
        const parsed = JSON.parse(saved);
        if (!parsed.token) {
          setAuth({ user: null, token: null, checking: false });
          return;
        }

        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${parsed.token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Session check failed');
        }

        const user = await res.json();
        setAuth({ user, token: parsed.token, checking: false });
      } catch (err) {
        console.error('Session check error:', err);
        localStorage.removeItem('jobtrackr_auth');
        setAuth({ user: null, token: null, checking: false });
      }
    }

    checkSession();
  }, []);

  // ======= UTIL: reload applications from backend =======
  async function reloadApplications(tokenToUse) {
    const token = tokenToUse || auth.token;
    if (!token) return;

    setLoadingApps(true);
    setLoadError('');
    try {
      const res = await fetch('/api/applications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to load applications');
      }
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedId(data[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Load applications error:', err);
      setLoadError('Failed to load applications from server.');
      setApplications([]);
      setSelectedId(null);
    } finally {
      setLoadingApps(false);
    }
  }

  // ======= LOAD APPLICATIONS AFTER AUTH =======
  useEffect(() => {
    if (!auth.user || !auth.token) return;
    reloadApplications(auth.token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, auth.token]);

  const selectedApplication =
    applications.find((a) => a.id === selectedId) || null;

  // ======= ANALYTICS =======
  const analytics = useMemo(() => {
    const total = applications.length;
    const byStatus = {};
    const perMonth = {};

    for (const app of applications) {
      if (!app) continue;
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

  // ======= FILTERS =======
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (!app) return false;
      if (filters.status && app.status !== filters.status) return false;
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const company = app.company_name || '';
        const role = app.role_title || '';
        const text = `${company} ${role}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [applications, filters]);

  // ======= TIMELINE =======
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
      if (!app) continue;
      pushEvent(app, app.oa_due_date, 'OA Due');
      pushEvent(app, app.next_interview_date, 'Interview');
    }

    events.sort((a, b) => a.date - b.date);

    return events;
  }, [applications]);

  // ======= CRUD: Save application =======
  const handleSaveApplication = async (form) => {
    if (!auth.token) return;
    setSaving(true);
    try {
      let res;
      if (selectedApplication) {
        res = await fetch(`/api/applications/${selectedApplication.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(form),
        });
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && data.error) || 'Failed to save application');
      }

      // After create/update, always reload from server to avoid weird state
      await reloadApplications();

      setToast({
        type: 'success',
        message: selectedApplication
          ? 'Application updated.'
          : 'Application created.',
      });
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
    if (!auth.token) return;
    if (!window.confirm('Delete this application?')) return;
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        throw new Error((data && data.error) || 'Delete failed');
      }
      // reload from backend after delete
      await reloadApplications();
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

  // ======= Email → DB update (auth needed) =======
  const handleEmailStatus = async (result) => {
    if (!auth.token) return;
    const { company_guess, status, note } = result || {};
    if (!status || !company_guess) return;

    try {
      const res = await fetch('/api/applications/email-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ company_guess, status, note }),
      });

      if (!res.ok) {
        console.error('Email update failed:', await res.text());
        return;
      }

      const updated = await res.json();
      if (!updated || !updated.id) {
        return;
      }

      // update local state
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

  // ======= Login / Register handler =======
  async function handleAuth(credentials, mode) {
    const path =
      mode === 'register' ? '/api/auth/register' : '/api/auth/login';

    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    setAuth({
      user: data.user,
      token: data.token,
      checking: false,
    });

    localStorage.setItem(
      'jobtrackr_auth',
      JSON.stringify({ token: data.token })
    );

    // after login, load data
    await reloadApplications(data.token);
  }

  function handleLogout() {
    setAuth({ user: null, token: null, checking: false });
    setApplications([]);
    setSelectedId(null);
    localStorage.removeItem('jobtrackr_auth');
  }

  // ======= Gmail integration handlers =======
  async function handleConnectEmail() {
    if (!auth.token) return;
    try {
      const res = await fetch('/api/gmail/auth-url', {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to get Gmail auth URL');
      }

      window.open(
        data.url,
        '_blank',
        'width=500,height=700,noopener,noreferrer'
      );

      setToast({
        type: 'success',
        message: 'Gmail connect window opened. Complete it in the new tab.',
      });
    } catch (err) {
      console.error('Connect email failed:', err);
      setToast({
        type: 'error',
        message: 'Failed to start Gmail connect flow.',
      });
    }
  }

  async function handleSyncGmail() {
    if (!auth.token) return;
    try {
      const res = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gmail sync failed');
      }

      await reloadApplications();

      setToast({
        type: 'success',
        message: `Gmail sync complete. Updated ${data.updated || 0} applications.`,
      });

      setNotesRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Gmail sync error:', err);
      setToast({
        type: 'error',
        message: 'Gmail sync failed. See console for details.',
      });
    }
  }

  const editorButtonLabel = editorOpen
    ? 'Hide Application Editor'
    : selectedApplication
    ? 'Edit Selected Application'
    : 'Add Application';

  // ======= RENDER =======
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
          {auth.user && (
            <span
              style={{
                fontSize: '0.8rem',
                color: '#9ca3af',
                marginRight: 4,
              }}
            >
              Signed in as {auth.user.email}
            </span>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={handleNewApplication}
            disabled={!auth.user}
          >
            + New Application
          </button>

          <button
            type="button"
            className="btn-ghost"
            title="Connect Gmail so JobTrackr can read status emails."
            onClick={handleConnectEmail}
            disabled={!auth.user}
          >
            Connect Gmail
          </button>

          <div className="app-badge">
            CS360 Prototype · Full Stack + Insights
          </div>

          {auth.user && (
            <button
              type="button"
              className="btn-ghost"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* If still checking session */}
      {auth.checking && (
        <div className="panel">
          <div className="empty-state">Checking session…</div>
        </div>
      )}

      {/* Not logged in: show login/register only */}
      {!auth.checking && !auth.user && (
        <>
          <LoginPanel onAuth={handleAuth} />
        </>
      )}

      {/* Logged in: full dashboard */}
      {!auth.checking && auth.user && (
        <>
          {loadError && (
            <div className="panel" style={{ marginBottom: 10 }}>
              <div className="empty-state">{loadError}</div>
            </div>
          )}

          {/* Gmail sync panel */}
          <div className="panel" style={{ marginBottom: 10 }}>
            <div className="panel-subtitle">
              After connecting Gmail, pull in recent application status emails.
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSyncGmail}
              disabled={!auth.user}
            >
              Sync Gmail Now
            </button>
          </div>

          <ApplicationFilters filters={filters} onChange={setFilters} />

          {loadingApps ? (
            <div className="panel">
              <div className="empty-state">Loading applications…</div>
            </div>
          ) : (
            <>
              <div className="dashboard-grid">
                <AnalyticsPanel analytics={analytics} />
                <ApplicationList
                  applications={filteredApps}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                />
              </div>

              <NotesPreview
                selectedApplication={selectedApplication}
                refreshKey={notesRefreshKey}
                token={auth.token}
              />

              <TimelinePanel events={upcomingEvents} />

              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditorOpen((open) => !open)}
                >
                  {editorButtonLabel}
                </button>
              </div>

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
                      token={auth.token}
                      onNoteAdded={() =>
                        setNotesRefreshKey((k) => k + 1)
                      }
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

              <EmailSimulator onEmailStatus={handleEmailStatus} />
            </>
          )}
        </>
      )}
    </div>
  );
}
