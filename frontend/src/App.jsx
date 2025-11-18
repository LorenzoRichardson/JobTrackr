// src/App.jsx
import { useMemo, useState } from 'react';
import ApplicationFilters from './components/ApplicationFilters';
import ApplicationForm from './components/ApplicationForm';
import ApplicationList from './components/ApplicationList';
import {
  sampleApplications,
} from './data/sampleApplications';

export default function App() {
  const [applications, setApplications] = useState(sampleApplications);
  const [filters, setFilters] = useState({ status: '', query: '' });
  const [selectedId, setSelectedId] = useState(
    sampleApplications.length > 0 ? sampleApplications[0].id : null
  );

  const nextId = useMemo(
    () => (applications.length ? Math.max(...applications.map((a) => a.id)) + 1 : 1),
    [applications]
  );

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

  const selectedApplication = applications.find((a) => a.id === selectedId) || null;

  const handleSaveApplication = (form) => {
    if (selectedApplication) {
      // Edit existing
      const updated = applications.map((app) =>
        app.id === selectedApplication.id
          ? { ...app, ...form }
          : app
      );
      setApplications(updated);
    } else {
      // Add new
      const newApp = {
        id: nextId,
        ...form,
        notes: [],
      };
      setApplications([newApp, ...applications]);
      setSelectedId(newApp.id);
    }
  };

  const handleDelete = (id) => {
    setApplications(applications.filter((a) => a.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleSelect = (id) => {
    setSelectedId(id);
  };

  const handleClearSelection = () => {
    setSelectedId(null);
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
        <div className="app-badge">CS360 Prototype · Frontend Only</div>
      </header>

      <ApplicationFilters filters={filters} onChange={setFilters} />

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
    </div>
  );
}
