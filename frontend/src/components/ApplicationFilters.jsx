// src/components/ApplicationFilters.jsx
import { STATUS_OPTIONS } from '../data/sampleApplications';

export default function ApplicationFilters({ filters, onChange }) {
  const handleStatusChange = (e) => {
    onChange({ ...filters, status: e.target.value });
  };

  const handleQueryChange = (e) => {
    onChange({ ...filters, query: e.target.value });
  };

  return (
    <div className="panel" style={{ marginBottom: 12 }}>
      <h2>Filters</h2>
      <div className="panel-subtitle">
        Quickly slice applications by status or search by company / role.
      </div>
      <div className="filters-row">
        <label>
          Status:&nbsp;
          <select value={filters.status} onChange={handleStatusChange}>
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <input
          type="text"
          placeholder="Search company or role…"
          value={filters.query}
          onChange={handleQueryChange}
        />
      </div>
    </div>
  );
}
