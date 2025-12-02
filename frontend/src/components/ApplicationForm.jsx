// src/components/ApplicationForm.jsx
import { useEffect, useState } from 'react';

const STATUS_OPTIONS = [
  'Saved',
  'Applied',
  'OA',
  'Interview',
  'Offer',
  'Rejected',
];

const ROLE_TYPES = ['Internship', 'Full-time'];

export default function ApplicationForm({
  selected,
  onSave,
  onClearSelection,
  saving,
}) {
  const isEdit = !!selected;

  const [form, setForm] = useState({
    company_name: '',
    role_title: '',
    location: '',
    role_type: '',
    status: 'Applied',
    job_link: '',
    applied_date: '',
    oa_due_date: '',
    next_interview_date: '',
  });

  useEffect(() => {
    if (selected) {
      setForm({
        company_name: selected.company_name || '',
        role_title: selected.role_title || '',
        location: selected.location || '',
        role_type: selected.role_type || '',
        status: selected.status || 'Applied',
        job_link: selected.job_link || '',
        applied_date: selected.applied_date || '',
        oa_due_date: selected.oa_due_date || '',
        next_interview_date: selected.next_interview_date || '',
      });
    } else {
      setForm({
        company_name: '',
        role_title: '',
        location: '',
        role_type: '',
        status: 'Applied',
        job_link: '',
        applied_date: '',
        oa_due_date: '',
        next_interview_date: '',
      });
    }
  }, [selected]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.company_name.trim() || !form.role_title.trim()) {
      alert('Company and role title are required.');
      return;
    }
    onSave(form);
  }

  return (
    <div className="panel">
      <h2>{isEdit ? 'Edit Application' : 'Add Application'}</h2>
      <div className="panel-subtitle">
        {isEdit
          ? 'Update details for the selected application.'
          : 'Create a new application entry.'}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
        <div className="field">
          <label>Company</label>
          <input
            type="text"
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            placeholder="e.g., Google"
          />
        </div>

        <div className="field">
          <label>Role Title</label>
          <input
            type="text"
            name="role_title"
            value={form.role_title}
            onChange={handleChange}
            placeholder="e.g., Software Engineering Intern"
          />
        </div>

        <div className="field">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g., New York, NY (Hybrid)"
          />
        </div>

        <div className="field">
          <label>Role Type</label>
          <select
            name="role_type"
            value={form.role_type || ''}
            onChange={handleChange}
          >
            <option value="">Select…</option>
            {ROLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Job Link</label>
          <input
            type="url"
            name="job_link"
            value={form.job_link}
            onChange={handleChange}
            placeholder="https://…"
          />
        </div>

        <div className="field">
          <label>Applied Date</label>
          <input
            type="date"
            name="applied_date"
            value={form.applied_date || ''}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>OA Due Date</label>
          <input
            type="date"
            name="oa_due_date"
            value={form.oa_due_date || ''}
            onChange={handleChange}
          />
        </div>

        <div className="field">
          <label>Next Interview Date</label>
          <input
            type="date"
            name="next_interview_date"
            value={form.next_interview_date || ''}
            onChange={handleChange}
          />
        </div>

        <div className="btn-row" style={{ marginTop: 10 }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Application'}
          </button>

          {isEdit && (
            <button
              type="button"
              className="btn-ghost"
              onClick={onClearSelection}
              disabled={saving}
            >
              Clear Selection
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
