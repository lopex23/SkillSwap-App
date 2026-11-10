const db = require('../config/db');
const HttpError = require('../utils/httpError');

const MAX_SUGERENCIAS = 10;

// Detalle completo de una solicitud: materia, estudiante (sin email),
// tutores sugeridos por el matching y la sesión si ya fue aceptada.
const SELECT_SOLICITUD = `
  SELECT s.id_solicitud, s.estado, s.descripcion, s.fecha_solicitud,
         json_build_object('id_materia', m.id_materia,
                           'codigo_materia', m.codigo_materia,
                           'nombre_materia', m.nombre_materia) AS materia,
         json_build_object('id_estudiante', s.id_estudiante,
                           'nombre', ue.nombre, 'apellido', ue.apellido,
                           'carrera', ue.carrera, 'semestre', ue.semestre) AS estudiante,
         COALESCE((
           SELECT json_agg(json_build_object(
                    'id_tutor', mt.id_tutor,
                    'nombre', ut.nombre, 'apellido', ut.apellido,
                    'reputacion_promedio', t.reputacion_promedio,
                    'total_tutorias', t.total_tutorias,
                    'puntaje_match', mt.puntaje_match)
                  ORDER BY mt.puntaje_match DESC, ut.nombre)
             FROM matching_tutor mt
             JOIN tutores t   ON t.id_tutor = mt.id_tutor
             JOIN usuarios ut ON ut.id_usuario = mt.id_tutor
            WHERE mt.id_solicitud = s.id_solicitud
         ), '[]') AS tutores_sugeridos,
         (
           SELECT json_build_object(
                    'id_sesion', se.id_sesion,
                    'id_tutor', se.id_tutor,
                    'tutor', us.nombre || ' ' || us.apellido,
                    'fecha_inicio', se.fecha_inicio,
                    'fecha_fin', se.fecha_fin,
                    'modalidad', se.modalidad,
                    'estado', se.estado)
             FROM sesiones_tutoria se
             JOIN usuarios us ON us.id_usuario = se.id_tutor
            WHERE se.id_solicitud = s.id_solicitud
            ORDER BY se.id_sesion DESC
            LIMIT 1
         ) AS sesion
    FROM solicitudes_tutoria s
    JOIN materias m  ON m.id_materia = s.id_materia
    JOIN usuarios ue ON ue.id_usuario = s.id_estudiante
`;

async function buscarPorId(id) {
  const { rows } = await db.query(`${SELECT_SOLICITUD} WHERE s.id_solicitud = $1`, [id]);
  return rows[0] || null;
}

async function listarDeEstudiante(idEstudiante, estado) {
  const { rows } = await db.query(
    `${SELECT_SOLICITUD}
      WHERE s.id_estudiante = $1 AND ($2::text IS NULL OR s.estado = $2)
      ORDER BY s.fecha_solicitud DESC`,
    [idEstudiante, estado ?? null]
  );
  return rows;
}

// Solicitudes pendientes de las materias que enseña el tutor (sin las suyas propias).
async function listarDisponiblesParaTutor(idTutor) {
  const { rows } = await db.query(
    `${SELECT_SOLICITUD}
      WHERE s.estado = 'pendiente'
        AND s.id_estudiante <> $1
        AND EXISTS (SELECT 1 FROM usuario_materia um
                     WHERE um.id_usuario = $1 AND um.id_materia = s.id_materia)
      ORDER BY s.fecha_solicitud`,
    [idTutor]
  );
  return rows;
}

async function tutorDictaMateria(idTutor, idMateria, client = db) {
  const { rowCount } = await client.query(
    'SELECT 1 FROM usuario_materia WHERE id_usuario = $1 AND id_materia = $2',
    [idTutor, idMateria]
  );
  return rowCount > 0;
}

// Crea la solicitud y calcula los tutores sugeridos en una sola transacción.
//
// Puntaje de matching (0 a 1):
//   50% reputación (reputacion_promedio / 5; sin calificaciones cuenta como 3/5)
//   30% nivel en la materia (avanzado 1, intermedio 0.66, básico 0.33)
//   20% tiene horarios de disponibilidad registrados
async function crear({ idEstudiante, idMateria, descripcion }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO solicitudes_tutoria (id_estudiante, id_materia, descripcion, estado)
       VALUES ($1, $2, $3, 'pendiente')
       RETURNING id_solicitud`,
      [idEstudiante, idMateria, descripcion]
    );
    const idSolicitud = rows[0].id_solicitud;

    await client.query(
      `INSERT INTO matching_tutor (id_solicitud, id_tutor, puntaje_match)
       SELECT $1, t.id_tutor,
              ROUND(
                  0.5 * COALESCE(t.reputacion_promedio, 3) / 5
                + 0.3 * CASE um.nivel WHEN 'avanzado' THEN 1
                                      WHEN 'intermedio' THEN 0.66
                                      ELSE 0.33 END
                + 0.2 * CASE WHEN EXISTS (SELECT 1 FROM disponibilidad_tutor d
                                           WHERE d.id_tutor = t.id_tutor)
                             THEN 1 ELSE 0 END
              , 2) AS puntaje
         FROM tutores t
         JOIN usuario_materia um ON um.id_usuario = t.id_tutor AND um.id_materia = $2
        WHERE t.id_tutor <> $3
        ORDER BY puntaje DESC
        LIMIT ${MAX_SUGERENCIAS}`,
      [idSolicitud, idMateria, idEstudiante]
    );

    await client.query('COMMIT');
    return idSolicitud;
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      throw new HttpError(409, 'Ya tienes una solicitud pendiente para esta materia');
    }
    if (err.code === '23503') throw new HttpError(404, 'La materia no existe');
    throw err;
  } finally {
    client.release();
  }
}

// Solo el dueño puede cancelar, y solo si sigue pendiente.
async function cancelar(idSolicitud, idEstudiante) {
  const { rows } = await db.query(
    `UPDATE solicitudes_tutoria SET estado = 'cancelada'
      WHERE id_solicitud = $1 AND id_estudiante = $2 AND estado = 'pendiente'
      RETURNING id_solicitud`,
    [idSolicitud, idEstudiante]
  );
  return rows.length > 0;
}

// El tutor acepta la solicitud y se crea la sesión programada.
// FOR UPDATE bloquea la fila: si dos tutores aceptan a la vez, solo uno gana.
async function aceptar({ idSolicitud, idTutor, fechaInicio, fechaFin, modalidad }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT id_estudiante, id_materia, estado FROM solicitudes_tutoria WHERE id_solicitud = $1 FOR UPDATE',
      [idSolicitud]
    );
    const solicitud = rows[0];
    if (!solicitud) throw new HttpError(404, 'Solicitud no encontrada');
    if (solicitud.estado !== 'pendiente') {
      throw new HttpError(409, `La solicitud ya no está pendiente (estado: ${solicitud.estado})`);
    }
    if (solicitud.id_estudiante === idTutor) {
      throw new HttpError(403, 'No puedes aceptar tu propia solicitud');
    }
    if (!(await tutorDictaMateria(idTutor, solicitud.id_materia, client))) {
      throw new HttpError(403, 'Solo puedes aceptar solicitudes de materias que enseñas');
    }

    const cruce = await client.query(
      `SELECT 1 FROM sesiones_tutoria
        WHERE id_tutor = $1 AND estado = 'programada'
          AND fecha_inicio < $3 AND fecha_fin > $2
        LIMIT 1`,
      [idTutor, fechaInicio, fechaFin]
    );
    if (cruce.rowCount > 0) {
      throw new HttpError(409, 'Ya tienes otra sesión programada que se cruza con ese horario');
    }

    await client.query(
      `INSERT INTO sesiones_tutoria (id_solicitud, id_tutor, fecha_inicio, fecha_fin, modalidad, estado)
       VALUES ($1, $2, $3, $4, $5, 'programada')`,
      [idSolicitud, idTutor, fechaInicio, fechaFin, modalidad]
    );
    await client.query(
      "UPDATE solicitudes_tutoria SET estado = 'asignada' WHERE id_solicitud = $1",
      [idSolicitud]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  buscarPorId,
  listarDeEstudiante,
  listarDisponiblesParaTutor,
  tutorDictaMateria,
  crear,
  cancelar,
  aceptar,
};
