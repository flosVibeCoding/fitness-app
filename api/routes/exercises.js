const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/exercises?day_type=push
router.get('/', async (req, res) => {
  try {
    const { day_type } = req.query;
    const params = [];
    let query = 'SELECT * FROM exercises WHERE is_active = true';
    if (day_type) {
      params.push(day_type);
      query += ` AND day_type = $${params.length}`;
    }
    query += ' ORDER BY day_type, sort_order';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Übungen' });
  }
});

// GET /api/exercises/:id/history  -> letzte Sets für Progressions-Ansicht
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT ws.session_date, ss.set_number, ss.weight_kg, ss.reps, ss.rpe
       FROM session_sets ss
       JOIN workout_sessions ws ON ws.id = ss.session_id
       WHERE ss.exercise_id = $1
       ORDER BY ws.session_date DESC, ss.set_number ASC
       LIMIT 100`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Historie' });
  }
});

module.exports = router;
