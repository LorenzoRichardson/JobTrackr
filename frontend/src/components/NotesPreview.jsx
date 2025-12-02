// src/components/NotesPreview.jsx
import { useEffect, useState } from 'react';

export default function NotesPreview({ selectedApplication, refreshKey }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const appId = selectedApplication ? selectedApplication.id : null;

  useEffect(() => {
    if (!appId) {
      setNotes([]);
      return;
    }

    async function loadNotes() {
      setLoading(true);
      try {
        const res = await fetch(`/api/applications/${appId}/notes`);
        const data = await res.json();
        setNotes(data);
      } catch (err) {
        console.error('Failed to load notes preview:', err);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, [appId, refreshKey]);

  if (!selectedApplication) {
    return (
      <div className="panel" style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: '0.95rem' }}>Notes</h3>
        <div className="panel-subtitle">
          Select an application to view its notes.
        </div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <h3 style={{ fontSize: '0.95rem' }}>
        Notes for {selectedApplication.company_name} –{' '}
        {selectedApplication.role_title}
      </h3>
      <div className="panel-subtitle">
        Read-only snapshot of notes for this application.
      </div>

      {loading ? (
        <div className="empty-state" style={{ marginTop: 8 }}>
          Loading notes…
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 8 }}>
          No notes for this application.
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            marginTop: 8,
          }}
        >
          {notes.map((note) => (
            <li
              key={note.id}
              style={{
                padding: '6px 0',
                borderBottom: '1px solid #1f2937',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginBottom: 2,
                }}
              >
                {new Date(note.created_at).toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {note.content}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
