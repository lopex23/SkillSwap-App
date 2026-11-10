const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario.model');
const { signToken } = require('../utils/jwt');
const HttpError = require('../utils/httpError');

const SALT_ROUNDS = 10;
const ROLES_REGISTRABLES = ['estudiante', 'tutor']; // "administrador" no se puede auto-asignar
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Hash de relleno: en el login se compara aunque el email no exista,
// para que el tiempo de respuesta no revele qué emails están registrados.
const HASH_FALSO = bcrypt.hashSync('contraseña-de-relleno', SALT_ROUNDS);

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validarRegistro(body = {}) {
  const errores = {};
  const datos = {
    nombre: texto(body.nombre),
    apellido: texto(body.apellido),
    email: texto(body.email).toLowerCase(),
    password: typeof body.password === 'string' ? body.password : '',
    carrera: texto(body.carrera) || null,
    semestre: body.semestre === undefined || body.semestre === null || body.semestre === '' ? null : Number(body.semestre),
    rol: texto(body.rol).toLowerCase() || 'estudiante',
  };

  if (!datos.nombre) errores.nombre = 'El nombre es obligatorio';
  else if (datos.nombre.length > 100) errores.nombre = 'Máximo 100 caracteres';

  if (!datos.apellido) errores.apellido = 'El apellido es obligatorio';
  else if (datos.apellido.length > 100) errores.apellido = 'Máximo 100 caracteres';

  if (!EMAIL_REGEX.test(datos.email)) errores.email = 'Email inválido';
  else if (datos.email.length > 150) errores.email = 'Máximo 150 caracteres';

  if (datos.password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres';
  else if (Buffer.byteLength(datos.password, 'utf8') > 72) errores.password = 'La contraseña es demasiado larga (máximo 72 bytes)';

  if (datos.carrera && datos.carrera.length > 100) errores.carrera = 'Máximo 100 caracteres';

  if (datos.semestre !== null && !(Number.isInteger(datos.semestre) && datos.semestre >= 1 && datos.semestre <= 12)) {
    errores.semestre = 'El semestre debe ser un número entero entre 1 y 12';
  }

  if (!ROLES_REGISTRABLES.includes(datos.rol)) {
    errores.rol = `El rol debe ser uno de: ${ROLES_REGISTRABLES.join(', ')}`;
  }

  return { datos, errores };
}

// POST /api/auth/register
async function register(req, res) {
  const { datos, errores } = validarRegistro(req.body);
  if (Object.keys(errores).length > 0) {
    throw new HttpError(400, 'Datos de registro inválidos', errores);
  }

  const passwordHash = await bcrypt.hash(datos.password, SALT_ROUNDS);
  const idUsuario = await Usuario.crear({ ...datos, passwordHash });
  const usuario = await Usuario.buscarPorId(idUsuario);

  res.status(201).json({ usuario, token: signToken(usuario) });
}

// POST /api/auth/login
async function login(req, res) {
  const email = texto(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    throw new HttpError(400, 'Email y contraseña son obligatorios');
  }

  const encontrado = await Usuario.buscarPorEmail(email);
  const coincide = await bcrypt.compare(password, encontrado?.password_hash || HASH_FALSO);

  if (!encontrado || !coincide) {
    throw new HttpError(401, 'Email o contraseña incorrectos');
  }

  const usuario = Usuario.sinPassword(encontrado);
  res.json({ usuario, token: signToken(usuario) });
}

// GET /api/auth/me (requiere token)
async function me(req, res) {
  const usuario = await Usuario.buscarPorId(req.user.id);
  if (!usuario) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  res.json({ usuario });
}

module.exports = { register, login, me };
