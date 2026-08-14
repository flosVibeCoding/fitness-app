const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/bodyweight?limit=90
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 90;
    const { rows } = await pool.query(
      `SELECT * FROM bodyweight_logs ORDER BY log_date DESC LIMIT $1`,
      [limit]
    );
    res.json(rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Laden der Gewichtsdaten' });
  }
});

// POST /api/bodyweight { log_date, weight_kg }
router.post('/', async (req, res) => {
  try {
    const { log_date, weight_kg } = req.body;
    if (!log_date || !weight_kg) {
      return res.status(400).json({ error: 'log_date und weight_kg erforderlich' });
    }
    const { rows } = await pool.query(
      `INSERT INTO bodyweight_logs (log_date, weight_kg, source)
       VALUES ($1, $2, 'manual')
       ON CONFLICT (log_date) DO UPDATE SET weight_kg = EXCLUDED.weight_kg
       RETURNING *`,
      [log_date, weight_kg]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Speichern' });
  }
});

module.exports = router;
