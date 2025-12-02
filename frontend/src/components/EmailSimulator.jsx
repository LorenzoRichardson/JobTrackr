// src/components/EmailSimulator.jsx
import { useState } from 'react';

export default function EmailSimulator({ onEmailStatus }) {
  const [subject, setSubject] = useState('');
  const [snippet, setSnippet] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSimulate() {
    if (!subject.trim()) {
      alert('Subject is required.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/email/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, snippet }),
      });

      const data = await res.json();
      console.log('Simulator response:', data);
      setResult(data);

      // Notify parent so it can update the dashboard
      if (onEmailStatus) {
        onEmailStatus(data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <h2>Email Simulator</h2>
      <div className="panel-subtitle">
        Test how recruiter emails are classified into statuses
        (Applied / OA / Interview / Offer / Rejected) and how they update the
        dashboard.
      </div>

      <div className="field">
        <label>Email Subject</label>
        <input
          type="text"
          placeholder="e.g., Google - We would like to invite you to interview"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="field" style={{ marginTop: 8 }}>
        <label>Email Snippet / Body (optional)</label>
        <textarea
          placeholder="e.g., Please choose a time for your upcoming SWE intern interview..."
          value={snippet}
          onChange={(e) => setSnippet(e.target.value)}
        />
      </div>

      <div className="btn-row" style={{ marginTop: 10 }}>
        <button
          className="btn-secondary"
          onClick={handleSimulate}
          disabled={loading}
        >
          {loading ? 'Analyzing…' : 'Simulate Email'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 15 }}>
          <h3 style={{ fontSize: '1rem' }}>Result</h3>

          <div className="note-item">
            <strong>Status:</strong> {result.status || 'Unknown'}
          </div>
          <div className="note-item">
            <strong>Company Guess:</strong>{' '}
            {result.company_guess || 'Unknown'}
          </div>
          <div className="note-item">
            <strong>Generated Note:</strong> {result.note}
          </div>
        </div>
      )}
    </div>
  );
}
