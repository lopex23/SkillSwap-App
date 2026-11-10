const { Router } = require('express');
const tutores = require('../controllers/tutores.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = Router();
const soloTutor = [requireAuth, requireRole('tutor')];

// Rutas "/me/..." antes de "/:id" para que "me" no se tome como un id.
router.get('/me/materias', ...soloTutor, tutores.misMaterias);
router.post('/me/materias', ...soloTutor, tutores.agregarMateria);
router.delete('/me/materias/:idMateria', ...soloTutor, tutores.quitarMateria);

router.get('/me/disponibilidad', ...soloTutor, tutores.miDisponibilidad);
router.post('/me/disponibilidad', ...soloTutor, tutores.agregarDisponibilidad);
router.delete('/me/disponibilidad/:id', ...soloTutor, tutores.quitarDisponibilidad);

// Consulta de tutores: requiere sesión (cualquier rol)
router.get('/', requireAuth, tutores.listar);
router.get('/:id', requireAuth, tutores.obtener);

module.exports = router;
