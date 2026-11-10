const { Router } = require('express');
const auth = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = Router();

// Express 5 envía automáticamente al manejador de errores
// cualquier excepción de estos handlers async.
router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', requireAuth, auth.me);

module.exports = router;
