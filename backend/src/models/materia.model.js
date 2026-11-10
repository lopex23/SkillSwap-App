const db = require('../config/db');
const HttpError = require('../utils/httpError');

const COLUMNAS = 'id_materia, codigo_materia, nombre_materia';

// Traduce errores de PostgreSQL a respuestas HTTP comprensibles.
function traducirError(err) {
  if (err.code === '23505') return new HttpError(409, 'Ya existe una materia con ese código');
  if (err.code === '23503') {
    return new HttpError(409, 'La materia no se puede eliminar porque tiene tutores, solicitudes o progreso asociados');
  }
  return err;
}

async function listar(busqueda) {
  if (busqueda) {
    const { rows } = await db.query(
      `SELECT ${COLUMNAS} FROM materias
        WHERE nombre_materia ILIKE $1 OR codigo_materia ILIKE $1
        ORDER BY nombre_materia`,
      [`%${busqueda}%`]
    );
    return rows;
  }
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM materias ORDER BY nombre_materia`);
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM materias WHERE id_materia = $1`, [id]);
  return rows[0] || null;
}

async function crear({ codigo_materia, nombre_materia }) {
  try {
    const { rows } = await db.query(
      `INSERT INTO materias (codigo_materia, nombre_materia) VALUES ($1, $2) RETURNING ${COLUMNAS}`,
      [codigo_materia, nombre_materia]
    );
    return rows[0];
  } catch (err) {
    throw traducirError(err);
  }
}

// Actualización parcial: solo cambia los campos enviados.
async function actualizar(id, { codigo_materia, nombre_materia }) {
  try {
    const { rows } = await db.query(
      `UPDATE materias
          SET codigo_materia = COALESCE($2, codigo_materia),
              nombre_materia = COALESCE($3, nombre_materia)
        WHERE id_materia = $1
        RETURNING ${COLUMNAS}`,
      [id, codigo_materia ?? null, nombre_materia ?? null]
    );
    return rows[0] || null;
  } catch (err) {
    throw traducirError(err);
  }
}

async function eliminar(id) {
  try {
    const { rowCount } = await db.query('DELETE FROM materias WHERE id_materia = $1', [id]);
    return rowCount > 0;
  } catch (err) {
    throw traducirError(err);
  }
}

module.exports = { listar, buscarPorId, crear, actualizar, eliminar };
