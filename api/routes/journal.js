const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/journal?limit=30
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const { rows } = await pool.query(
      `SELECT * FROM daily_journal ORDER BY log_date DESC LIMIT $1`,
      [limit]
    );
    res.json(rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden des Tagebuchs' });
  }
});

// GET /api/journal/by-date?date=2026-08-14
router.get('/by-date', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date erforderlich' });
    const { rows } = await pool.query(`SELECT * FROM daily_journal WHERE log_date = $1`, [date]);
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden des Eintrags' });
  }
});

// POST /api/journal { log_date, sleep_hours, energy_level, soreness_level, stress_level, notes }
router.post('/', async (req, res) => {
  try {
    const { log_date, sleep_hours, energy_level, soreness_level, stress_level, notes } = req.body;
    if (!log_date) return res.status(400).json({ error: 'log_date erforderlich' });
    const { rows } = await pool.query(
      `INSERT INTO daily_journal (log_date, sleep_hours, energy_level, soreness_level, stress_level, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (log_date) DO UPDATE SET
         sleep_hours = EXCLUDED.sleep_hours,
         energy_level = EXCLUDED.energy_level,
         soreness_level = EXCLUDED.soreness_level,
         stress_level = EXCLUDED.stress_level,
         notes = EXCLUDED.notes
       RETURNING *`,
      [log_date, sleep_hours || null, energy_level || null, soreness_level || null, stress_level || null, notes || null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Speichern' });
  }
});

module.exports = router;
