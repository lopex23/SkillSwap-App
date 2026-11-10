const { Router } = require('express');
const solicitudes = require('../controllers/solicitudes.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = Router();
const soloEstudiante = [requireAuth, requireRole('estudiante')];
const soloTutor = [requireAuth, requireRole('tutor')];

// Rutas fijas antes de "/:id"
router.post('/', ...soloEstudiante, solicitudes.crear);
router.get('/mias', ...soloEstudiante, solicitudes.mias);
router.get('/disponibles', ...soloTutor, solicitudes.disponibles);

router.get('/:id', requireAuth, solicitudes.obtener);
router.patch('/:id/cancelar', ...soloEstudiante, solicitudes.cancelar);
router.post('/:id/aceptar', ...soloTutor, solicitudes.aceptar);

module.exports = router;
