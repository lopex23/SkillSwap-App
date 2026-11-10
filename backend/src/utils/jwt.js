const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET || SECRET.length < 32) {
  throw new Error(
    'Falta JWT_SECRET en backend/.env o es demasiado corto (mínimo 32 caracteres). Revisa .env.example.'
  );
}

function signToken(usuario) {
  return jwt.sign({ roles: usuario.roles }, SECRET, {
    subject: String(usuario.id_usuario),
    expiresIn: EXPIRES_IN,
    algorithm: 'HS256',
  });
}

// Lanza un error si el token es inválido o expiró.
function verifyToken(token) {
  return jwt.verify(token, SECRET, { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken };
