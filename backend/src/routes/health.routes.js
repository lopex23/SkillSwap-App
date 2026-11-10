const { Router } = require('express');
const db = require('../config/db');

const router = Router();

// GET /api/health -> el servidor está vivo
router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/health/db -> prueba real contra la base de datos
router.get('/db', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT now() AS hora_servidor,
             current_database() AS base_de_datos,
             (SELECT count(*)::int FROM information_schema.tables
               WHERE table_schema = 'public') AS tablas_public
    `);
    res.json({ status: 'ok', database: rows[0] });
  } catch (err) {
    console.error('Fallo la conexión a la base de datos:', err.message);
    res.status(503).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
