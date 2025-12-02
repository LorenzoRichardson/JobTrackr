// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';

import {
  inferStatusFromEmail,
  inferCompanyFromSubject,
  buildNoteFromEmail,
} from './services/emailStatusService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 🔐 Basic auth scaffolding: later we plug real auth/JWT in here
function getUserIdFromRequest(req) {
  // TODO: replace with real authentication (e.g., decoded JWT)
  // For now we always use demo user id = 1
  return 1;
}

app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

app.use(express.json());

// ==============================
// Health check
// ==============================
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'JobTrackr backend up' });
});

// ==============================
// DB test route (Neon)
// ==============================
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
// Applications CRUD
// ==============================

// GET all applications for current user
app.get('/api/applications', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  try {
    const result = await pool.query(
      'SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// CREATE a new application
app.post('/api/applications', async (req, res) => {
  const userId = getUserIdFromRequest(req);
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
        userId,
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
app.put('/api/applications/:id', async (req, res) => {
  const userId = getUserIdFromRequest(req);
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
        userId,
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
app.delete('/api/applications/:id', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const appId = Number(req.params.id);

  try {
    const result = await pool.query(
      'DELETE FROM applications WHERE id = $1 AND user_id = $2',
      [appId, userId]
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
app.get('/api/applications/:id/notes', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const appId = Number(req.params.id);

  try {
    const result = await pool.query(
      `SELECT id, application_id, user_id, content, created_at
       FROM notes
       WHERE application_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [appId, userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/applications/:id/notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// CREATE a note for an application
app.post('/api/applications/:id/notes', async (req, res) => {
  const userId = getUserIdFromRequest(req);
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
      [appId, userId, content.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/applications/:id/notes error:', err);
    res.status(500).json({ error: 'Failed to create note' });
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
// Takes { company_guess, status, note } and:
//  - finds matching application by company
//  - updates its status
//  - inserts a note
//  - returns the updated application
app.post('/api/applications/email-update', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  const { company_guess, status, note } = req.body;

  if (!company_guess || !status) {
    return res
      .status(400)
      .json({ error: 'company_guess and status are required' });
  }

  try {
    // Find an application whose company_name contains the guess
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

    // Update status
    const updateResult = await pool.query(
      `UPDATE applications
       SET status = $1,
           last_updated = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, appRow.id]
    );

    const updatedApp = updateResult.rows[0];

    // Insert note (best-effort)
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
