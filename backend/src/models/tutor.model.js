const db = require('../config/db');
const HttpError = require('../utils/httpError');

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// Perfil público del tutor: sin email ni datos sensibles.
// materias y disponibilidad se devuelven como arreglos JSON.
const SELECT_TUTOR = `
  SELECT t.id_tutor, u.nombre, u.apellido, u.carrera, u.semestre,
         t.reputacion_promedio, t.total_tutorias,
         COALESCE((
           SELECT json_agg(json_build_object(
                    'id_materia', m.id_materia,
                    'codigo_materia', m.codigo_materia,
                    'nombre_materia', m.nombre_materia,
                    'nivel', um.nivel) ORDER BY m.nombre_materia)
             FROM usuario_materia um
             JOIN materias m ON m.id_materia = um.id_materia
            WHERE um.id_usuario = t.id_tutor
         ), '[]') AS materias,
         COALESCE((
           SELECT json_agg(json_build_object(
                    'id_disponibilidad', d.id_disponibilidad,
                    'dia_semana', d.dia_semana,
                    'hora_inicio', to_char(d.hora_inicio, 'HH24:MI'),
                    'hora_fin', to_char(d.hora_fin, 'HH24:MI'))
                  ORDER BY array_position($1::text[], d.dia_semana::text), d.hora_inicio)
             FROM disponibilidad_tutor d
            WHERE d.id_tutor = t.id_tutor
         ), '[]') AS disponibilidad
    FROM tutores t
    JOIN usuarios u ON u.id_usuario = t.id_tutor
`;

// Lista tutores; si se pasa idMateria, solo los que enseñan esa materia.
async function listar(idMateria) {
  const { rows } = await db.query(
    `${SELECT_TUTOR}
      WHERE $2::int IS NULL
         OR EXISTS (SELECT 1 FROM usuario_materia um
                     WHERE um.id_usuario = t.id_tutor AND um.id_materia = $2)
      ORDER BY t.reputacion_promedio DESC NULLS LAST, t.total_tutorias DESC, u.nombre`,
    [DIAS, idMateria ?? null]
  );
  return rows;
}

async function buscarPorId(idTutor) {
  const { rows } = await db.query(`${SELECT_TUTOR} WHERE t.id_tutor = $2`, [DIAS, idTutor]);
  return rows[0] || null;
}

// ---------- Materias que enseña el tutor (tabla usuario_materia) ----------

async function listarMaterias(idTutor) {
  const { rows } = await db.query(
    `SELECT m.id_materia, m.codigo_materia, m.nombre_materia, um.nivel
       FROM usuario_materia um
       JOIN materias m ON m.id_materia = um.id_materia
      WHERE um.id_usuario = $1
      ORDER BY m.nombre_materia`,
    [idTutor]
  );
  return rows;
}

// Agrega la materia o, si ya la tenía, actualiza el nivel.
async function guardarMateria(idTutor, idMateria, nivel) {
  try {
    await db.query(
      `INSERT INTO usuario_materia (id_usuario, id_materia, nivel)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_usuario, id_materia) DO UPDATE SET nivel = EXCLUDED.nivel`,
      [idTutor, idMateria, nivel]
    );
  } catch (err) {
    if (err.code === '23503') throw new HttpError(404, 'La materia no existe');
    throw err;
  }
}

async function quitarMateria(idTutor, idMateria) {
  const { rowCount } = await db.query(
    'DELETE FROM usuario_materia WHERE id_usuario = $1 AND id_materia = $2',
    [idTutor, idMateria]
  );
  return rowCount > 0;
}

// ---------- Disponibilidad del tutor ----------

async function listarDisponibilidad(idTutor) {
  const { rows } = await db.query(
    `SELECT id_disponibilidad, dia_semana,
            to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
            to_char(hora_fin, 'HH24:MI') AS hora_fin
       FROM disponibilidad_tutor
      WHERE id_tutor = $1
      ORDER BY array_position($2::text[], dia_semana::text), hora_inicio`,
    [idTutor, DIAS]
  );
  return rows;
}

async function agregarDisponibilidad(idTutor, { dia_semana, hora_inicio, hora_fin }) {
  // Rechaza franjas que se cruzan con otra del mismo día.
  const cruce = await db.query(
    `SELECT 1 FROM disponibilidad_tutor
      WHERE id_tutor = $1 AND dia_semana = $2
        AND hora_inicio < $4::time AND hora_fin > $3::time
      LIMIT 1`,
    [idTutor, dia_semana, hora_inicio, hora_fin]
  );
  if (cruce.rowCount > 0) {
    throw new HttpError(409, 'La franja se cruza con otra disponibilidad del mismo día');
  }

  const { rows } = await db.query(
    `INSERT INTO disponibilidad_tutor (id_tutor, dia_semana, hora_inicio, hora_fin)
     VALUES ($1, $2, $3, $4)
     RETURNING id_disponibilidad, dia_semana,
               to_char(hora_inicio, 'HH24:MI') AS hora_inicio,
               to_char(hora_fin, 'HH24:MI') AS hora_fin`,
    [idTutor, dia_semana, hora_inicio, hora_fin]
  );
  return rows[0];
}

// Solo borra si la franja pertenece al tutor.
async function quitarDisponibilidad(idTutor, idDisponibilidad) {
  const { rowCount } = await db.query(
    'DELETE FROM disponibilidad_tutor WHERE id_disponibilidad = $1 AND id_tutor = $2',
    [idDisponibilidad, idTutor]
  );
  return rowCount > 0;
}

module.exports = {
  DIAS,
  listar,
  buscarPorId,
  listarMaterias,
  guardarMateria,
  quitarMateria,
  listarDisponibilidad,
  agregarDisponibilidad,
  quitarDisponibilidad,
};
