const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'fitness',
  password: process.env.PGPASSWORD || 'fitness',
  database: process.env.PGDATABASE || 'fitness',
});

module.exports = pool;
