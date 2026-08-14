require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration erfolgreich abgeschlossen.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration fehlgeschlagen:', err);
  process.exit(1);
});
