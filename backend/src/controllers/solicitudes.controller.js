const Solicitud = require('../models/solicitud.model');
const Materia = require('../models/materia.model');
const HttpError = require('../utils/httpError');
const { texto, parseId, assertSinErrores } = require('../utils/validators');

const ESTADOS = ['pendiente', 'asignada', 'cancelada'];
const MODALIDADES = ['virtual', 'presencial'];
const DURACION_MIN = 30; // minutos
const DURACION_MAX = 240; // minutos
// Fecha ISO 8601 con zona horaria obligatoria, ej. 2026-11-20T15:00:00-05:00 o ...Z
const ISO_CON_ZONA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// POST /api/solicitudes  { id_materia, descripcion }   (estudiante)
async function crear(req, res) {
  const errores = {};
  let idMateria;
  try {
    idMateria = parseId(req.body?.id_materia, 'id_materia');
  } catch {
    errores.id_materia = 'id_materia debe ser un número entero positivo';
  }
  const descripcion = texto(req.body?.descripcion);
  if (descripcion.length < 10) errores.descripcion = 'Describe en qué necesitas ayuda (mínimo 10 caracteres)';
  else if (descripcion.length > 1000) errores.descripcion = 'Máximo 1000 caracteres';
  assertSinErrores(errores, 'Datos de solicitud inválidos');

  if (!(await Materia.buscarPorId(idMateria))) throw new HttpError(404, 'La materia no existe');

  const id = await Solicitud.crear({ idEstudiante: req.user.id, idMateria, descripcion });
  res.status(201).json({ solicitud: await Solicitud.buscarPorId(id) });
}

// GET /api/solicitudes/mias?estado=pendiente   (estudiante)
async function mias(req, res) {
  let estado = null;
  if (req.query.estado !== undefined) {
    estado = texto(req.query.estado).toLowerCase();
    if (!ESTADOS.includes(estado)) {
      throw new HttpError(400, `El estado debe ser uno de: ${ESTADOS.join(', ')}`);
    }
  }
  res.json({ solicitudes: await Solicitud.listarDeEstudiante(req.user.id, estado) });
}

// GET /api/solicitudes/disponibles   (tutor)
async function disponibles(req, res) {
  res.json({ solicitudes: await Solicitud.listarDisponiblesParaTutor(req.user.id) });
}

// GET /api/solicitudes/:id
// La ve: el estudiante dueño, un administrador, el tutor asignado,
// o un tutor que enseña la materia mientras siga pendiente.
async function obtener(req, res) {
  const solicitud = await Solicitud.buscarPorId(parseId(req.params.id));
  if (!solicitud) throw new HttpError(404, 'Solicitud no encontrada');

  const { id, roles } = req.user;
  const puedeVer =
    solicitud.estudiante.id_estudiante === id ||
    roles.includes('administrador') ||
    solicitud.sesion?.id_tutor === id ||
    (solicitud.estado === 'pendiente' &&
      roles.includes('tutor') &&
      (await Solicitud.tutorDictaMateria(id, solicitud.materia.id_materia)));

  // 404 en vez de 403 para no revelar que la solicitud existe
  if (!puedeVer) throw new HttpError(404, 'Solicitud no encontrada');
  res.json({ solicitud });
}

// PATCH /api/solicitudes/:id/cancelar   (estudiante dueño)
async function cancelar(req, res) {
  const id = parseId(req.params.id);
  const cancelada = await Solicitud.cancelar(id, req.user.id);
  if (!cancelada) {
    const solicitud = await Solicitud.buscarPorId(id);
    if (!solicitud || solicitud.estudiante.id_estudiante !== req.user.id) {
      throw new HttpError(404, 'Solicitud no encontrada');
    }
    throw new HttpError(409, `Solo se pueden cancelar solicitudes pendientes (estado: ${solicitud.estado})`);
  }
  res.json({ solicitud: await Solicitud.buscarPorId(id) });
}

// POST /api/solicitudes/:id/aceptar  { fecha_inicio, fecha_fin, modalidad }   (tutor)
async function aceptar(req, res) {
  const idSolicitud = parseId(req.params.id);
  const errores = {};

  const inicioTxt = texto(req.body?.fecha_inicio);
  const finTxt = texto(req.body?.fecha_fin);
  const inicio = ISO_CON_ZONA.test(inicioTxt) ? new Date(inicioTxt) : null;
  const fin = ISO_CON_ZONA.test(finTxt) ? new Date(finTxt) : null;
  const formato = 'Fecha ISO con zona horaria, ej. 2026-11-20T15:00:00-05:00';

  if (!inicio || Number.isNaN(inicio.getTime())) errores.fecha_inicio = formato;
  else if (inicio <= new Date()) errores.fecha_inicio = 'La sesión debe ser en el futuro';

  if (!fin || Number.isNaN(fin.getTime())) errores.fecha_fin = formato;
  else if (inicio && !errores.fecha_inicio) {
    const minutos = (fin - inicio) / 60000;
    if (minutos < DURACION_MIN || minutos > DURACION_MAX) {
      errores.fecha_fin = `La sesión debe durar entre ${DURACION_MIN} y ${DURACION_MAX} minutos`;
    }
  }

  const modalidad = texto(req.body?.modalidad).toLowerCase();
  if (!MODALIDADES.includes(modalidad)) errores.modalidad = `La modalidad debe ser: ${MODALIDADES.join(' o ')}`;

  assertSinErrores(errores, 'Datos de la sesión inválidos');

  await Solicitud.aceptar({ idSolicitud, idTutor: req.user.id, fechaInicio: inicio, fechaFin: fin, modalidad });
  res.status(201).json({ solicitud: await Solicitud.buscarPorId(idSolicitud) });
}

module.exports = { crear, mias, disponibles, obtener, cancelar, aceptar };
