const Tutor = require('../models/tutor.model');
const Materia = require('../models/materia.model');
const Sesion = require('../models/sesion.model');
const HttpError = require('../utils/httpError');
const { texto, parseId, assertSinErrores } = require('../utils/validators');

const NIVELES = ['básico', 'intermedio', 'avanzado'];
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM en formato 24 h

// Quita tildes para aceptar "miercoles" o "miércoles", "basico" o "básico".
function sinTildes(valor) {
  return valor.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizarOpcion(valor, opciones) {
  const buscado = sinTildes(texto(valor).toLowerCase());
  return opciones.find((o) => sinTildes(o) === buscado) || null;
}

// ---------- Público (con sesión) ----------

// GET /api/tutores?materia=ID
async function listar(req, res) {
  const idMateria = req.query.materia !== undefined ? parseId(req.query.materia, 'materia') : null;
  const tutores = await Tutor.listar(idMateria);
  res.json({ tutores });
}

// GET /api/tutores/:id
async function obtener(req, res) {
  const tutor = await Tutor.buscarPorId(parseId(req.params.id));
  if (!tutor) throw new HttpError(404, 'Tutor no encontrado');
  res.json({ tutor });
}

// GET /api/tutores/:id/calificaciones  (anónimas)
async function calificaciones(req, res) {
  const id = parseId(req.params.id);
  if (!(await Tutor.buscarPorId(id))) throw new HttpError(404, 'Tutor no encontrado');
  res.json({ calificaciones: await Sesion.calificacionesDeTutor(id) });
}

// ---------- Materias del tutor autenticado ----------

// GET /api/tutores/me/materias
async function misMaterias(req, res) {
  res.json({ materias: await Tutor.listarMaterias(req.user.id) });
}

// POST /api/tutores/me/materias  { id_materia, nivel }
async function agregarMateria(req, res) {
  const errores = {};
  let idMateria;
  try {
    idMateria = parseId(req.body?.id_materia, 'id_materia');
  } catch {
    errores.id_materia = 'id_materia debe ser un número entero positivo';
  }
  const nivel = normalizarOpcion(req.body?.nivel ?? 'intermedio', NIVELES);
  if (!nivel) errores.nivel = `El nivel debe ser uno de: ${NIVELES.join(', ')}`;
  assertSinErrores(errores);

  if (!(await Materia.buscarPorId(idMateria))) throw new HttpError(404, 'La materia no existe');

  await Tutor.guardarMateria(req.user.id, idMateria, nivel);
  res.status(201).json({ materias: await Tutor.listarMaterias(req.user.id) });
}

// DELETE /api/tutores/me/materias/:idMateria
async function quitarMateria(req, res) {
  const quitada = await Tutor.quitarMateria(req.user.id, parseId(req.params.idMateria, 'idMateria'));
  if (!quitada) throw new HttpError(404, 'No tienes esa materia registrada');
  res.status(204).end();
}

// ---------- Disponibilidad del tutor autenticado ----------

// GET /api/tutores/me/disponibilidad
async function miDisponibilidad(req, res) {
  res.json({ disponibilidad: await Tutor.listarDisponibilidad(req.user.id) });
}

// POST /api/tutores/me/disponibilidad  { dia_semana, hora_inicio, hora_fin }
async function agregarDisponibilidad(req, res) {
  const errores = {};
  const dia_semana = normalizarOpcion(req.body?.dia_semana, Tutor.DIAS);
  const hora_inicio = texto(req.body?.hora_inicio);
  const hora_fin = texto(req.body?.hora_fin);

  if (!dia_semana) errores.dia_semana = `El día debe ser uno de: ${Tutor.DIAS.join(', ')}`;
  if (!HORA_REGEX.test(hora_inicio)) errores.hora_inicio = 'Formato HH:MM (24 horas), ej. 14:00';
  if (!HORA_REGEX.test(hora_fin)) errores.hora_fin = 'Formato HH:MM (24 horas), ej. 16:00';
  if (!errores.hora_inicio && !errores.hora_fin && hora_inicio >= hora_fin) {
    errores.hora_fin = 'La hora de fin debe ser posterior a la de inicio';
  }
  assertSinErrores(errores, 'Datos de disponibilidad inválidos');

  const franja = await Tutor.agregarDisponibilidad(req.user.id, { dia_semana, hora_inicio, hora_fin });
  res.status(201).json({ disponibilidad: franja });
}

// DELETE /api/tutores/me/disponibilidad/:id
async function quitarDisponibilidad(req, res) {
  const quitada = await Tutor.quitarDisponibilidad(req.user.id, parseId(req.params.id));
  if (!quitada) throw new HttpError(404, 'Franja de disponibilidad no encontrada');
  res.status(204).end();
}

module.exports = {
  listar,
  obtener,
  calificaciones,
  misMaterias,
  agregarMateria,
  quitarMateria,
  miDisponibilidad,
  agregarDisponibilidad,
  quitarDisponibilidad,
};
