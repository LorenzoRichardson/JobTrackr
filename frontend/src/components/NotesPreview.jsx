// src/components/NotesPreview.jsx
import { useEffect, useState } from 'react';

export default function NotesPreview({ selectedApplication, refreshKey, token }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No app selected or no token -> clear notes and skip
    if (!selectedApplication || !selectedApplication.id || !token) {
      setNotes([]);
      return;
    }

    let cancelled = false;

    async function loadNotes() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/applications/${selectedApplication.id}/notes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          console.error(
            'NotesPreview fetch failed:',
            res.status,
            res.statusText
          );
          if (!cancelled) {
            setNotes([]); // keep it as an array so .map is always safe
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setNotes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('NotesPreview error:', err);
        if (!cancelled) {
          setNotes([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNotes();

    return () => {
      cancelled = true;
    };
  }, [selectedApplication?.id, refreshKey, token]);

  // If no application selected, show nothing / simple panel
  if (!selectedApplication) {
    return (
      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Notes</h2>
        <div className="panel-subtitle">
          Select an application to see its recent notes.
        </div>
        <div className="empty-state">No application selected.</div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <h2>
        Notes for {selectedApplication.company_name} –{' '}
        {selectedApplication.role_title}
      </h2>
      <div className="panel-subtitle">
        Read-only snapshot of notes for this application.
      </div>

      {loading && <div className="empty-state">Loading notes…</div>}

      {!loading && notes.length === 0 && (
        <div className="empty-state">No notes yet for this application.</div>
      )}

      {!loading && notes.length > 0 && (
        <div className="notes-list">
          {notes.map((note) => (
            <div key={note.id} className="note-item">
              <div className="note-meta">
                {note.created_at
                  ? new Date(note.created_at).toLocaleString()
                  : ''}
              </div>
              <div>{note.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
