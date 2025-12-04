// src/components/LoginPanel.jsx
import { useState } from 'react';

export default function LoginPanel({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onAuth(
        {
          name: name || undefined,
          email,
          password,
        },
        mode
      );
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <h2>{mode === 'login' ? 'Sign in to JobTrackr' : 'Create your JobTrackr account'}</h2>
      <div className="panel-subtitle">
        Your applications, notes, and email-based updates are tied to your account.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setMode('login')}
          style={{
            opacity: mode === 'login' ? 1 : 0.6,
          }}
        >
          Login
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setMode('register')}
          style={{
            opacity: mode === 'register' ? 1 : 0.8,
          }}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 6 }}>
        {mode === 'register' && (
          <div className="field form-grid-full">
            <label htmlFor="name">Name (optional)</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lorenzo Richardson"
            />
          </div>
        )}

        <div className="field form-grid-full">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
          />
        </div>

        <div className="field form-grid-full">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="btn-row form-grid-full" style={{ marginTop: 10 }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting
              ? mode === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'login'
                ? 'Sign In'
                : 'Register'}
          </button>
        </div>
      </form>

      {error && (
        <div className="empty-state" style={{ marginTop: 8, color: '#fecaca' }}>
          {error}
        </div>
      )}
    </div>
  );
}
