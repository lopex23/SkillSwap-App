const { Router } = require('express');
const materias = require('../controllers/materias.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

const router = Router();
const soloAdmin = [requireAuth, requireRole('administrador')];

// Consulta: pública
router.get('/', materias.listar);
router.get('/:id', materias.obtener);

// Gestión: solo administrador
router.post('/', ...soloAdmin, materias.crear);
router.put('/:id', ...soloAdmin, materias.actualizar);
router.delete('/:id', ...soloAdmin, materias.eliminar);

module.exports = router;
