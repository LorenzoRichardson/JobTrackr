// src/components/ApplicationForm.jsx
import { useEffect, useState } from 'react';
import { ROLE_TYPES, STATUS_OPTIONS } from '../data/sampleApplications';

const emptyForm = {
  company_name: '',
  role_title: '',
  role_type: '',
  status: 'Applied',
  location: '',
  job_link: '',
  applied_date: '',
  next_interview_date: '',
};

export default function ApplicationForm({ selected, onSave, onClearSelection }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (selected) {
      setForm({
        company_name: selected.company_name || '',
        role_title: selected.role_title || '',
        role_type: selected.role_type || '',
        status: selected.status || 'Applied',
        location: selected.location || '',
        job_link: selected.job_link || '',
        applied_date: selected.applied_date || '',
        next_interview_date: selected.next_interview_date || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [selected]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.company_name || !form.role_title) {
      alert('Company name and role title are required.');
      return;
    }
    onSave(form);
  };

  const isEditing = Boolean(selected);

  return (
    <div className="panel">
      <h2>{isEditing ? 'Edit Application' : 'Add Application'}</h2>
      <div className="panel-subtitle">
        Minimal required fields to add an application in under 30 seconds.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Company *</label>
            <input
              type="text"
              value={form.company_name}
              onChange={handleChange('company_name')}
              placeholder="e.g., Google"
            />
          </div>

          <div className="field">
            <label>Role Title *</label>
            <input
              type="text"
              value={form.role_title}
              onChange={handleChange('role_title')}
              placeholder="e.g., Software Engineering Intern"
            />
          </div>

          <div className="field">
            <label>Role Type</label>
            <select value={form.role_type} onChange={handleChange('role_type')}>
              <option value="">Select</option>
              {ROLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={handleChange('status')}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="field form-grid-full">
            <label>Job Link (for future auto-fill)</label>
            <input
              type="url"
              value={form.job_link}
              onChange={handleChange('job_link')}
              placeholder="Paste posting URL (LinkedIn, Handshake, etc.)"
            />
          </div>

          <div className="field">
            <label>Location</label>
            <input
              type="text"
              value={form.location}
              onChange={handleChange('location')}
              placeholder="e.g., NYC, Remote"
            />
          </div>

          <div className="field">
            <label>Applied Date</label>
            <input
              type="date"
              value={form.applied_date}
              onChange={handleChange('applied_date')}
            />
          </div>

          <div className="field form-grid-full">
            <label>Next Interview / OA Date (optional)</label>
            <input
              type="date"
              value={form.next_interview_date}
              onChange={handleChange('next_interview_date')}
            />
          </div>
        </div>

        <div className="btn-row">
          <button type="submit" className="btn-primary">
            {isEditing ? 'Save Changes' : 'Add Application'}
          </button>
          {isEditing && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => onClearSelection()}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
