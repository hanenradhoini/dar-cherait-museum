// backend/config/postgres.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'dar_cherait_reservations',
  user:     process.env.PG_USER     || 'postgres',
  password: process.env.PG_PASSWORD,
  max:      10,
  idleTimeoutMillis:      30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Erreur inattendue pool PostgreSQL :', err);
});

module.exports = pool;