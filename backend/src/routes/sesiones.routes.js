const { Router } = require('express');
const sesiones = require('../controllers/sesiones.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = Router();

// Rutas fijas antes de "/:id"
router.get('/mias', requireAuth, sesiones.mias);
router.get('/progreso', requireAuth, requireRole('estudiante'), sesiones.progreso);

router.get('/:id', requireAuth, sesiones.obtener);
router.patch('/:id/completar', requireAuth, requireRole('tutor'), sesiones.completar);
router.patch('/:id/cancelar', requireAuth, sesiones.cancelar);
router.post('/:id/calificar', requireAuth, requireRole('estudiante'), sesiones.calificar);

module.exports = router;
