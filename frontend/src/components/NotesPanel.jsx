// src/components/NotesPanel.jsx
import { useEffect, useState } from 'react';

export default function NotesPanel({ applicationId, refreshKey, token, onNoteAdded }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load notes whenever application or refreshKey changes
  useEffect(() => {
    if (!applicationId || !token) {
      setNotes([]);
      return;
    }

    let cancelled = false;

    async function loadNotes() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/applications/${applicationId}/notes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error('NotesPanel fetch failed:', res.status, res.statusText);
          if (res.status === 401) {
            setError('Not authorized to load notes.');
          }
          if (!cancelled) {
            setNotes([]);
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setNotes(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('NotesPanel error:', err);
        if (!cancelled) {
          setError('Failed to load notes.');
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
  }, [applicationId, refreshKey, token]);

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim() || !applicationId || !token) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/applications/${applicationId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newNote.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error((data && data.error) || 'Failed to add note');
      }

      // Add new note to the top of the list
      setNotes((prev) => [data, ...(Array.isArray(prev) ? prev : [])]);
      setNewNote('');

      if (onNoteAdded) {
        onNoteAdded();
      }
    } catch (err) {
      console.error('Add note failed:', err);
      setError(err.message || 'Failed to add note.');
    } finally {
      setSaving(false);
    }
  }

  if (!applicationId) {
    return (
      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Notes</h2>
        <div className="panel-subtitle">
          Save the application first to start attaching notes.
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

      <form onSubmit={handleAddNote} className="form-grid" style={{ marginTop: 6 }}>
        <div className="field form-grid-full">
          <label htmlFor="new-note">Add a note (e.g., "Spoke with recruiter")</label>
          <textarea
            id="new-note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note (e.g., 'Spoke with recruiter, waiting on next steps')"
          />
        </div>
        <div className="btn-row form-grid-full" style={{ marginTop: 6 }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !newNote.trim()}
          >
            {saving ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>

      {error && (
        <div className="empty-state" style={{ marginTop: 6, color: '#fecaca' }}>
          {error}
        </div>
      )}

      {loading && <div className="empty-state">Loading notes…</div>}

      {!loading && notes.length === 0 && !error && (
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
