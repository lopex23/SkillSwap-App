const Sesion = require('../models/sesion.model');
const HttpError = require('../utils/httpError');
const { texto, parseId, assertSinErrores } = require('../utils/validators');

const ESTADOS = ['programada', 'completada', 'cancelada'];
const ROLES = ['tutor', 'estudiante'];

function filtroOpcional(valor, opciones, nombre) {
  if (valor === undefined) return null;
  const v = texto(valor).toLowerCase();
  if (!opciones.includes(v)) throw new HttpError(400, `"${nombre}" debe ser uno de: ${opciones.join(', ')}`);
  return v;
}

// GET /api/sesiones/mias?estado=&rol=
async function mias(req, res) {
  const estado = filtroOpcional(req.query.estado, ESTADOS, 'estado');
  const rol = filtroOpcional(req.query.rol, ROLES, 'rol');
  res.json({ sesiones: await Sesion.listarDeUsuario(req.user.id, { estado, rol }) });
}

// GET /api/sesiones/progreso   (estudiante)
async function progreso(req, res) {
  res.json({ progreso: await Sesion.progresoDeEstudiante(req.user.id) });
}

// GET /api/sesiones/:id   (participantes o administrador; si no, 404)
async function obtener(req, res) {
  const sesion = await Sesion.buscarPorId(parseId(req.params.id));
  const { id, roles } = req.user;
  const puedeVer =
    sesion &&
    (sesion.tutor.id_tutor === id || sesion.estudiante.id_estudiante === id || roles.includes('administrador'));
  if (!puedeVer) throw new HttpError(404, 'Sesión no encontrada');
  res.json({ sesion });
}

// PATCH /api/sesiones/:id/completar   (tutor asignado)
async function completar(req, res) {
  const id = parseId(req.params.id);
  await Sesion.completar(id, req.user.id);
  res.json({ sesion: await Sesion.buscarPorId(id) });
}

// PATCH /api/sesiones/:id/cancelar   (tutor o estudiante de la sesión)
async function cancelar(req, res) {
  const id = parseId(req.params.id);
  const resultado = await Sesion.cancelar(id, req.user.id);
  res.json({ ...resultado, sesion: await Sesion.buscarPorId(id) });
}

// POST /api/sesiones/:id/calificar  { puntuacion, comentario? }   (estudiante de la sesión)
async function calificar(req, res) {
  const id = parseId(req.params.id);
  const errores = {};

  const puntuacion = Number(req.body?.puntuacion);
  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
    errores.puntuacion = 'La puntuación debe ser un entero de 1 a 5';
  }
  const comentario = texto(req.body?.comentario) || null;
  if (comentario && comentario.length > 1000) errores.comentario = 'Máximo 1000 caracteres';
  assertSinErrores(errores, 'Calificación inválida');

  await Sesion.calificar(id, req.user.id, { puntuacion, comentario });
  res.status(201).json({ sesion: await Sesion.buscarPorId(id) });
}

module.exports = { mias, progreso, obtener, completar, cancelar, calificar };
