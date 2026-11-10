const { Router } = require('express');
const db = require('../config/db');

const router = Router();

// GET /api/estadisticas  (público)
// Cifras agregadas para la página de inicio. Solo conteos: no expone datos personales.
router.get('/', async (req, res) => {
  const { rows } = await db.query(`
    SELECT (SELECT count(*)::int FROM tutores)                                    AS tutores,
           (SELECT count(*)::int FROM estudiantes)                                AS estudiantes,
           (SELECT count(*)::int FROM materias)                                   AS materias,
           (SELECT count(*)::int FROM sesiones_tutoria WHERE estado = 'completada') AS sesiones_completadas,
           (SELECT ROUND(AVG(puntuacion), 1) FROM calificaciones)                 AS calificacion_promedio
  `);
  res.json({ estadisticas: rows[0] });
});

module.exports = router;
