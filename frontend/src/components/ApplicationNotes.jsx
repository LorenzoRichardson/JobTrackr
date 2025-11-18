// src/components/ApplicationNotes.jsx
import { useState } from 'react';

export default function ApplicationNotes({ application }) {
  const [notes, setNotes] = useState(application.notes || []);
  const [noteText, setNoteText] = useState('');

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const newNote = {
      id: Date.now(),
      content: noteText.trim(),
      created_at: new Date().toLocaleString(),
    };
    setNotes([newNote, ...notes]);
    setNoteText('');
  };

  if (!application) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>
        Notes for {application.company_name} – {application.role_title}
      </h3>
      <div className="panel-subtitle">
        Track recruiter interactions, interview prep, and follow-ups.
      </div>

      <div className="field" style={{ marginTop: 6 }}>
        <label>Add a quick note</label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="e.g., Need to send thank-you email after interview."
        />
      </div>
      <div className="btn-row">
        <button type="button" className="btn-secondary" onClick={handleAddNote}>
          Add Note
        </button>
      </div>

      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="empty-state">No notes yet for this application.</div>
        ) : (
          notes.map((note) => (
            <div className="note-item" key={note.id}>
              <div className="note-meta">{note.created_at}</div>
              <div>{note.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
