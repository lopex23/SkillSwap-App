const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error(
    'Falta la variable DATABASE_URL. Copia backend/.env.example a backend/.env y completa los datos.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase exige SSL. DATABASE_SSL=false permite usar un PostgreSQL local sin SSL.
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Evita que un error en una conexión inactiva tumbe el proceso.
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
