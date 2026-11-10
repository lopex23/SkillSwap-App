const db = require('../config/db');
const HttpError = require('../utils/httpError');

// Sesión con materia, tutor, estudiante (sin emails) y su calificación si existe.
const SELECT_SESION = `
  SELECT se.id_sesion, se.id_solicitud, se.estado, se.modalidad,
         se.fecha_inicio, se.fecha_fin,
         json_build_object('id_materia', m.id_materia,
                           'codigo_materia', m.codigo_materia,
                           'nombre_materia', m.nombre_materia) AS materia,
         json_build_object('id_tutor', se.id_tutor,
                           'nombre', ut.nombre, 'apellido', ut.apellido) AS tutor,
         json_build_object('id_estudiante', s.id_estudiante,
                           'nombre', ue.nombre, 'apellido', ue.apellido) AS estudiante,
         (SELECT json_build_object('puntuacion', c.puntuacion, 'comentario', c.comentario)
            FROM calificaciones c WHERE c.id_sesion = se.id_sesion) AS calificacion
    FROM sesiones_tutoria se
    JOIN solicitudes_tutoria s ON s.id_solicitud = se.id_solicitud
    JOIN materias m            ON m.id_materia = s.id_materia
    JOIN usuarios ut           ON ut.id_usuario = se.id_tutor
    JOIN usuarios ue           ON ue.id_usuario = s.id_estudiante
`;

async function buscarPorId(id) {
  const { rows } = await db.query(`${SELECT_SESION} WHERE se.id_sesion = $1`, [id]);
  return rows[0] || null;
}

// Sesiones donde el usuario participa. rol: 'tutor' | 'estudiante' | null (ambos).
async function listarDeUsuario(idUsuario, { estado, rol } = {}) {
  const { rows } = await db.query(
    `${SELECT_SESION}
      WHERE (($3::text IS NULL OR $3 = 'tutor') AND se.id_tutor = $1
          OR ($3::text IS NULL OR $3 = 'estudiante') AND s.id_estudiante = $1)
        AND ($2::text IS NULL OR se.estado = $2)
      ORDER BY se.fecha_inicio DESC`,
    [idUsuario, estado ?? null, rol ?? null]
  );
  return rows;
}

// Bloquea la sesión y devuelve los datos necesarios para validar una transición.
async function bloquear(client, idSesion) {
  const { rows } = await client.query(
    `SELECT se.id_sesion, se.estado, se.id_tutor, se.fecha_inicio,
            s.id_solicitud, s.id_estudiante, s.id_materia
       FROM sesiones_tutoria se
       JOIN solicitudes_tutoria s ON s.id_solicitud = se.id_solicitud
      WHERE se.id_sesion = $1
      FOR UPDATE OF se`,
    [idSesion]
  );
  return rows[0] || null;
}

async function enTransaccion(fn) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// El tutor marca la sesión como completada. Efectos:
//   - total_tutorias del tutor + 1
//   - registro en historial_tutorias
//   - progreso_estudiante (sesiones_completadas + 1 en esa materia)
async function completar(idSesion, idTutor) {
  return enTransaccion(async (client) => {
    const se = await bloquear(client, idSesion);
    if (!se || se.id_tutor !== idTutor) throw new HttpError(404, 'Sesión no encontrada');
    if (se.estado !== 'programada') {
      throw new HttpError(409, `Solo se pueden completar sesiones programadas (estado: ${se.estado})`);
    }
    if (new Date(se.fecha_inicio) > new Date()) {
      throw new HttpError(409, 'La sesión todavía no ha empezado');
    }

    await client.query("UPDATE sesiones_tutoria SET estado = 'completada' WHERE id_sesion = $1", [idSesion]);
    await client.query(
      'UPDATE tutores SET total_tutorias = COALESCE(total_tutorias, 0) + 1 WHERE id_tutor = $1',
      [idTutor]
    );
    await client.query('INSERT INTO historial_tutorias (id_sesion) VALUES ($1)', [idSesion]);
    await client.query(
      `INSERT INTO progreso_estudiante (id_estudiante, id_materia, sesiones_completadas)
       VALUES ($1, $2, 1)
       ON CONFLICT (id_estudiante, id_materia)
       DO UPDATE SET sesiones_completadas = progreso_estudiante.sesiones_completadas + 1`,
      [se.id_estudiante, se.id_materia]
    );
  });
}

// Tutor o estudiante cancelan una sesión programada.
//   - Si cancela el estudiante: la solicitud queda 'cancelada'.
//   - Si cancela el tutor: la solicitud vuelve a 'pendiente' para que otro tutor
//     la tome (salvo que el estudiante ya tenga otra pendiente de esa materia).
async function cancelar(idSesion, idUsuario) {
  return enTransaccion(async (client) => {
    const se = await bloquear(client, idSesion);
    const esTutor = se && se.id_tutor === idUsuario;
    const esEstudiante = se && se.id_estudiante === idUsuario;
    if (!se || (!esTutor && !esEstudiante)) throw new HttpError(404, 'Sesión no encontrada');
    if (se.estado !== 'programada') {
      throw new HttpError(409, `Solo se pueden cancelar sesiones programadas (estado: ${se.estado})`);
    }

    await client.query("UPDATE sesiones_tutoria SET estado = 'cancelada' WHERE id_sesion = $1", [idSesion]);

    let estadoSolicitud = 'cancelada';
    if (esTutor) {
      const otraPendiente = await client.query(
        `SELECT 1 FROM solicitudes_tutoria
          WHERE id_estudiante = $1 AND id_materia = $2 AND estado = 'pendiente'`,
        [se.id_estudiante, se.id_materia]
      );
      if (otraPendiente.rowCount === 0) estadoSolicitud = 'pendiente';
    }
    await client.query('UPDATE solicitudes_tutoria SET estado = $2 WHERE id_solicitud = $1', [
      se.id_solicitud,
      estadoSolicitud,
    ]);
    return { canceladaPor: esTutor ? 'tutor' : 'estudiante', estadoSolicitud };
  });
}

// El estudiante califica una sesión completada (una sola vez) y se
// recalcula la reputación del tutor como promedio de todas sus calificaciones.
async function calificar(idSesion, idEstudiante, { puntuacion, comentario }) {
  return enTransaccion(async (client) => {
    const se = await bloquear(client, idSesion);
    if (!se || se.id_estudiante !== idEstudiante) throw new HttpError(404, 'Sesión no encontrada');
    if (se.estado !== 'completada') {
      throw new HttpError(409, `Solo se pueden calificar sesiones completadas (estado: ${se.estado})`);
    }

    // Bloquea al tutor para que dos calificaciones simultáneas no pisen el promedio
    await client.query('SELECT 1 FROM tutores WHERE id_tutor = $1 FOR UPDATE', [se.id_tutor]);

    try {
      await client.query(
        'INSERT INTO calificaciones (id_sesion, puntuacion, comentario) VALUES ($1, $2, $3)',
        [idSesion, puntuacion, comentario]
      );
    } catch (err) {
      if (err.code === '23505') throw new HttpError(409, 'Esta sesión ya fue calificada');
      throw err;
    }

    await client.query(
      `UPDATE tutores SET reputacion_promedio = (
         SELECT ROUND(AVG(c.puntuacion), 1)
           FROM calificaciones c
           JOIN sesiones_tutoria se ON se.id_sesion = c.id_sesion
          WHERE se.id_tutor = $1)
        WHERE id_tutor = $1`,
      [se.id_tutor]
    );
  });
}

// Calificaciones públicas de un tutor (anónimas: sin datos del estudiante).
async function calificacionesDeTutor(idTutor) {
  const { rows } = await db.query(
    `SELECT c.puntuacion, c.comentario, se.fecha_fin AS fecha,
            json_build_object('codigo_materia', m.codigo_materia,
                              'nombre_materia', m.nombre_materia) AS materia
       FROM calificaciones c
       JOIN sesiones_tutoria se   ON se.id_sesion = c.id_sesion
       JOIN solicitudes_tutoria s ON s.id_solicitud = se.id_solicitud
       JOIN materias m            ON m.id_materia = s.id_materia
      WHERE se.id_tutor = $1
      ORDER BY se.fecha_fin DESC`,
    [idTutor]
  );
  return rows;
}

// Progreso del estudiante: sesiones completadas por materia.
async function progresoDeEstudiante(idEstudiante) {
  const { rows } = await db.query(
    `SELECT m.id_materia, m.codigo_materia, m.nombre_materia, p.sesiones_completadas
       FROM progreso_estudiante p
       JOIN materias m ON m.id_materia = p.id_materia
      WHERE p.id_estudiante = $1
      ORDER BY p.sesiones_completadas DESC, m.nombre_materia`,
    [idEstudiante]
  );
  return rows;
}

module.exports = {
  buscarPorId,
  listarDeUsuario,
  completar,
  cancelar,
  calificar,
  calificacionesDeTutor,
  progresoDeEstudiante,
};
