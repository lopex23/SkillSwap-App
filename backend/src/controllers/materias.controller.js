const Materia = require('../models/materia.model');
const HttpError = require('../utils/httpError');
const { texto, parseId, assertSinErrores } = require('../utils/validators');

// Valida los campos. Con parcial=true (PUT) los campos ausentes se ignoran.
function validarMateria(body = {}, { parcial = false } = {}) {
  const errores = {};
  const datos = {};

  if (body.codigo_materia !== undefined || !parcial) {
    const codigo = texto(body.codigo_materia).toUpperCase();
    if (!codigo) errores.codigo_materia = 'El código es obligatorio';
    else if (codigo.length > 50) errores.codigo_materia = 'Máximo 50 caracteres';
    else datos.codigo_materia = codigo;
  }

  if (body.nombre_materia !== undefined || !parcial) {
    const nombre = texto(body.nombre_materia);
    if (!nombre) errores.nombre_materia = 'El nombre es obligatorio';
    else if (nombre.length > 100) errores.nombre_materia = 'Máximo 100 caracteres';
    else datos.nombre_materia = nombre;
  }

  if (parcial && Object.keys(datos).length === 0 && Object.keys(errores).length === 0) {
    errores.general = 'Envía al menos codigo_materia o nombre_materia';
  }

  assertSinErrores(errores, 'Datos de materia inválidos');
  return datos;
}

// GET /api/materias?q=texto
async function listar(req, res) {
  const materias = await Materia.listar(texto(req.query.q));
  res.json({ materias });
}

// GET /api/materias/:id
async function obtener(req, res) {
  const materia = await Materia.buscarPorId(parseId(req.params.id));
  if (!materia) throw new HttpError(404, 'Materia no encontrada');
  res.json({ materia });
}

// POST /api/materias (administrador)
async function crear(req, res) {
  const materia = await Materia.crear(validarMateria(req.body));
  res.status(201).json({ materia });
}

// PUT /api/materias/:id (administrador)
async function actualizar(req, res) {
  const id = parseId(req.params.id);
  const materia = await Materia.actualizar(id, validarMateria(req.body, { parcial: true }));
  if (!materia) throw new HttpError(404, 'Materia no encontrada');
  res.json({ materia });
}

// DELETE /api/materias/:id (administrador)
async function eliminar(req, res) {
  const eliminada = await Materia.eliminar(parseId(req.params.id));
  if (!eliminada) throw new HttpError(404, 'Materia no encontrada');
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
