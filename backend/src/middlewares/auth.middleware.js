const { verifyToken } = require('../utils/jwt');
const HttpError = require('../utils/httpError');

// Exige el header "Authorization: Bearer <token>" y deja el usuario en req.user.
function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Token de autenticación requerido'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: Number(payload.sub), roles: payload.roles || [] };
    next();
  } catch {
    next(new HttpError(401, 'Token inválido o expirado'));
  }
}

// Uso: router.get('/admin', requireAuth, requireRole('administrador'), handler)
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles.some((r) => rolesPermitidos.includes(r))) {
      return next(new HttpError(403, 'No tienes permiso para realizar esta acción'));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
