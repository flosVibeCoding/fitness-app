const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/sessions?limit=20
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const { rows: sessions } = await pool.query(
      `SELECT * FROM workout_sessions ORDER BY session_date DESC, id DESC LIMIT $1`,
      [limit]
    );
    if (sessions.length === 0) return res.json([]);

    const ids = sessions.map((s) => s.id);
    const { rows: sets } = await pool.query(
      `SELECT ss.*, e.name AS exercise_name, e.day_type
       FROM session_sets ss
       JOIN exercises e ON e.id = ss.exercise_id
       WHERE ss.session_id = ANY($1::int[])
       ORDER BY ss.exercise_id, ss.set_number`,
      [ids]
    );

    const bySession = sessions.map((s) => ({
      ...s,
      sets: sets.filter((set) => set.session_id === s.id),
    }));
    res.json(bySession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Sessions' });
  }
});

// GET /api/sessions/today?day_type=push
router.get('/by-date', async (req, res) => {
  try {
    const { date, day_type } = req.query;
    if (!date || !day_type) {
      return res.status(400).json({ error: 'date und day_type erforderlich' });
    }
    const { rows } = await pool.query(
      `SELECT ws.*, json_agg(
          json_build_object(
            'id', ss.id, 'exercise_id', ss.exercise_id, 'set_number', ss.set_number,
            'weight_kg', ss.weight_kg, 'reps', ss.reps, 'rpe', ss.rpe
          ) ORDER BY ss.set_number
        ) FILTER (WHERE ss.id IS NOT NULL) AS sets
       FROM workout_sessions ws
       LEFT JOIN session_sets ss ON ss.session_id = ws.id
       WHERE ws.session_date = $1 AND ws.day_type = $2
       GROUP BY ws.id`,
      [date, day_type]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Session' });
  }
});

// POST /api/sessions  { session_date, day_type, notes, sets: [{exercise_id, set_number, weight_kg, reps, rpe}] }
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { session_date, day_type, notes, sets } = req.body;
    if (!session_date || !day_type) {
      return res.status(400).json({ error: 'session_date und day_type erforderlich' });
    }

    await client.query('BEGIN');

    const upsertSession = await client.query(
      `INSERT INTO workout_sessions (session_date, day_type, notes, completed_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (session_date, day_type)
       DO UPDATE SET notes = EXCLUDED.notes, completed_at = now()
       RETURNING id`,
      [session_date, day_type, notes || null]
    );
    const sessionId = upsertSession.rows[0].id;

    // Alte Sets dieser Session ersetzen (einfacher als diffen)
    await client.query('DELETE FROM session_sets WHERE session_id = $1', [sessionId]);

    if (Array.isArray(sets) && sets.length > 0) {
      const values = [];
      const placeholders = sets.map((s, i) => {
        const base = i * 5;
        values.push(sessionId, s.exercise_id, s.set_number, s.weight_kg, s.reps);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
      });
      await client.query(
        `INSERT INTO session_sets (session_id, exercise_id, set_number, weight_kg, reps)
         VALUES ${placeholders.join(', ')}`,
        values
      );
    }

    await client.query('COMMIT');
    res.json({ id: sessionId, ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Speichern der Session' });
  } finally {
    client.release();
  }
});

module.exports = router;
