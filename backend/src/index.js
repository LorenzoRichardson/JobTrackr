// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { pool } from './db.js';

import {
  inferStatusFromEmail,
  inferCompanyFromSubject,
  buildNoteFromEmail,
} from './services/emailStatusService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ===== JWT helpers / middleware =====

function createToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = {
      id: payload.userId,
      email: payload.email,
    };
    next();
  } catch (err) {
    console.error('JWT verify failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ===== Gmail OAuth helper (demo: in-memory token store) =====
const gmailTokensByUser = new Map(); // key: userId -> tokens

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

app.use(express.json());

// ==============================
// Health / DB test
// ==============================
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'JobTrackr backend up' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error('DB Test Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================
// AUTH routes
// ==============================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
      `,
      [name || null, email.toLowerCase(), hash]
    );

    const user = result.rows[0];
    const token = createToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    delete user.password_hash;
    const token = createToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Current user
app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

// ==============================
// Applications CRUD (auth required)
// ==============================

// GET all applications for current user
app.get('/api/applications', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// CREATE a new application
app.post('/api/applications', authRequired, async (req, res) => {
  const {
    company_name,
    role_title,
    location,
    role_type,
    status,
    job_link,
    applied_date,
    next_interview_date,
  } = req.body;

  if (!company_name || !role_title) {
    return res
      .status(400)
      .json({ error: 'company_name and role_title are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO applications (
        user_id,
        company_name,
        role_title,
        location,
        role_type,
        status,
        job_link,
        applied_date,
        next_interview_date
      ) VALUES (
        $1, $2, $3, $4,
        $5,
        COALESCE($6, 'Applied'::application_status),
        $7, $8, $9
      )
      RETURNING *`,
      [
        req.user.id,
        company_name,
        role_title,
        location || null,
        role_type || null,
        status || null,
        job_link || null,
        applied_date || null,
        next_interview_date || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/applications error:', err);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// UPDATE an application
app.put('/api/applications/:id', authRequired, async (req, res) => {
  const appId = Number(req.params.id);
  const {
    company_name,
    role_title,
    location,
    role_type,
    status,
    job_link,
    applied_date,
    next_interview_date,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE applications
       SET company_name = $1,
           role_title = $2,
           location = $3,
           role_type = $4,
           status = $5,
           job_link = $6,
           applied_date = $7,
           next_interview_date = $8,
           last_updated = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        company_name,
        role_title,
        location || null,
        role_type || null,
        status,
        job_link || null,
        applied_date || null,
        next_interview_date || null,
        appId,
        req.user.id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/applications/:id error:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// DELETE an application
app.delete('/api/applications/:id', authRequired, async (req, res) => {
  const appId = Number(req.params.id);

  try {
    const result = await pool.query(
      'DELETE FROM applications WHERE id = $1 AND user_id = $2',
      [appId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/applications/:id error:', err);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// ==============================
// Notes API (per application)
// ==============================

// GET notes for an application
app.get('/api/applications/:id/notes', authRequired, async (req, res) => {
  const appId = Number(req.params.id);

  try {
    const result = await pool.query(
      `SELECT id, application_id, user_id, content, created_at
       FROM notes
       WHERE application_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [appId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/applications/:id/notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// CREATE a note for an application
app.post('/api/applications/:id/notes', authRequired, async (req, res) => {
  const appId = Number(req.params.id);
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notes (application_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, application_id, user_id, content, created_at`,
      [appId, req.user.id, content.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/applications/:id/notes error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// ==============================
// Gmail OAuth + Sync
// ==============================

// 1) Frontend asks for Google OAuth URL
app.get('/api/gmail/auth-url', authRequired, (req, res) => {
  try {
    const oAuth2Client = createOAuthClient();
    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      state: String(req.user.id),
      prompt: 'consent',
    });
    res.json({ url });
  } catch (err) {
    console.error('GET /api/gmail/auth-url error:', err);
    res.status(500).json({ error: 'Failed to create Gmail auth URL' });
  }
});

// 2) Google redirects here after user grants access
app.get('/api/gmail/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).send('Missing code or state.');
  }

  const userId = Number(state);
  if (!userId) {
    return res.status(400).send('Invalid state/user id.');
  }

  try {
    const oAuth2Client = createOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    gmailTokensByUser.set(userId, tokens);

    res.send(
      '<h1>Gmail connected ✅</h1><p>You can close this tab and return to JobTrackr.</p>'
    );
  } catch (err) {
    console.error('GET /api/gmail/callback error:', err);
    res.status(500).send('Failed to complete Gmail connection.');
  }
});

// 3) Manually trigger Gmail sync for current user
app.post('/api/gmail/sync', authRequired, async (req, res) => {
  const userId = req.user.id;
  const tokens = gmailTokensByUser.get(userId);

  if (!tokens) {
    return res.status(400).json({
      error: 'Gmail not connected yet. Click "Connect Gmail" first.',
    });
  }

  try {
    const oAuth2Client = createOAuthClient();
    oAuth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 15,
      q: 'newer_than:7d (subject:application OR subject:interview OR subject:offer OR subject:rejection OR subject:assessment)',
    });

    const messages = listRes.data.messages || [];
    const updatedApps = [];

    for (const meta of messages) {
      try {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: meta.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From'],
        });

        const payload = msg.data.payload || {};
        const headers = payload.headers || [];
        const subjectHeader = headers.find((h) => h.name === 'Subject');
        const subject = subjectHeader?.value || '(no subject)';
        const snippet = msg.data.snippet || '';

        const status = inferStatusFromEmail(subject, snippet);
        const company_guess = inferCompanyFromSubject(subject);
        const note = buildNoteFromEmail(status, subject, snippet);

        if (!company_guess || !status) continue;

        const findResult = await pool.query(
          `SELECT *
           FROM applications
           WHERE user_id = $1
             AND LOWER(company_name) LIKE '%' || LOWER($2) || '%'
           ORDER BY created_at DESC
           LIMIT 1`,
          [userId, company_guess]
        );

        if (findResult.rowCount === 0) continue;

        const appRow = findResult.rows[0];

        const updateResult = await pool.query(
          `UPDATE applications
           SET status = $1,
               last_updated = NOW()
           WHERE id = $2
           RETURNING *`,
          [status, appRow.id]
        );

        const updatedApp = updateResult.rows[0];

        if (note) {
          try {
            await pool.query(
              `INSERT INTO notes (application_id, user_id, content)
               VALUES ($1, $2, $3)`,
              [updatedApp.id, userId, note]
            );
          } catch (noteErr) {
            console.error('Gmail sync insert note error:', noteErr);
          }
        }

        updatedApps.push(updatedApp);
      } catch (msgErr) {
        console.error('Error processing Gmail message:', msgErr);
      }
    }

    gmailTokensByUser.set(userId, oAuth2Client.credentials);

    res.json({
      updated: updatedApps.length,
      applications: updatedApps,
    });
  } catch (err) {
    console.error('POST /api/gmail/sync error:', err);
    res.status(500).json({ error: 'Failed to sync Gmail.' });
  }
});

// ==============================
// Email Simulation Endpoint
// ==============================
app.post('/api/email/simulate', (req, res) => {
  const { subject, snippet } = req.body;

  if (!subject) {
    return res.status(400).json({ error: 'subject is required' });
  }

  const status = inferStatusFromEmail(subject, snippet);
  const company_guess = inferCompanyFromSubject(subject);
  const note = buildNoteFromEmail(status, subject, snippet || '');

  res.json({
    subject,
    snippet: snippet || '',
    status,
    company_guess,
    note,
  });
});

// ==============================
// Email → DB update route
// ==============================
app.post('/api/applications/email-update', authRequired, async (req, res) => {
  const userId = req.user.id;
  const { company_guess, status, note } = req.body;

  if (!company_guess || !status) {
    return res
      .status(400)
      .json({ error: 'company_guess and status are required' });
  }

  try {
    const findResult = await pool.query(
      `SELECT *
       FROM applications
       WHERE user_id = $1
         AND LOWER(company_name) LIKE '%' || LOWER($2) || '%'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, company_guess]
    );

    if (findResult.rowCount === 0) {
      return res.status(404).json({ error: 'No matching application found' });
    }

    const appRow = findResult.rows[0];

    const updateResult = await pool.query(
      `UPDATE applications
       SET status = $1,
           last_updated = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, appRow.id]
    );

    const updatedApp = updateResult.rows[0];

    if (note) {
      try {
        await pool.query(
          `INSERT INTO notes (application_id, user_id, content)
           VALUES ($1, $2, $3)`,
          [updatedApp.id, userId, note]
        );
      } catch (noteErr) {
        console.error('Insert note error:', noteErr);
      }
    }

    res.json(updatedApp);
  } catch (err) {
    console.error('POST /api/applications/email-update error:', err);
    res.status(500).json({ error: 'Failed to update application from email' });
  }
});

// ==============================
// Start Server
// ==============================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`JobTrackr backend listening on port ${PORT}`);
});
