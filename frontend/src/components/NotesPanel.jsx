// src/components/NotesPanel.jsx
import { useEffect, useState } from 'react';

export default function NotesPanel({ applicationId, refreshKey, onNoteAdded }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!applicationId) return;

    async function loadNotes() {
      setLoading(true);
      setLoadError('');
      try {
        const res = await fetch(`/api/applications/${applicationId}/notes`);
        const data = await res.json();
        setNotes(data);
      } catch (err) {
        console.error('Failed to load notes:', err);
        setLoadError('Failed to load notes.');
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, [applicationId, refreshKey]);

  async function handleAddNote() {
    if (!newNote.trim() || !applicationId) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });
      const created = await res.json();
      setNotes((prev) => [created, ...prev]);
      setNewNote('');
      if (onNoteAdded) {
        onNoteAdded(); // tells App to refresh preview too
      }
    } catch (err) {
      console.error('Failed to add note:', err);
      alert('Failed to add note.');
    } finally {
      setSavingNote(false);
    }
  }

  if (!applicationId) {
    return (
      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Notes</h2>
        <div className="panel-subtitle">
          Select an application to view and add notes.
        </div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <h2>Notes</h2>
      <div className="panel-subtitle">
        Email updates and your own notes are tracked here for this application.
      </div>

      {/* New note input */}
      <div style={{ marginTop: 10 }}>
        <textarea
          placeholder="Add a note (e.g., 'Spoke with recruiter, waiting on next steps')"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          style={{ minHeight: 60 }}
        />
        <div style={{ marginTop: 6 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleAddNote}
            disabled={savingNote || !newNote.trim()}
          >
            {savingNote ? 'Saving…' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="empty-state" style={{ marginTop: 10 }}>
          Loading notes…
        </div>
      ) : loadError ? (
        <div className="empty-state" style={{ marginTop: 10 }}>
          {loadError}
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 10 }}>
          No notes yet. Email-based updates and your notes will appear here.
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            marginTop: 12,
          }}
        >
          {notes.map((note) => (
            <li
              key={note.id}
              style={{
                padding: '8px 0',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginBottom: 2,
                }}
              >
                {new Date(note.created_at).toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: '0.9rem',
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
