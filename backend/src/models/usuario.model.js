const db = require('../config/db');
const HttpError = require('../utils/httpError');

const SELECT_USUARIO = `
  SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.carrera, u.semestre,
         u.fecha_registro, u.password_hash,
         COALESCE(array_agg(r.nombre_rol ORDER BY r.nombre_rol)
                  FILTER (WHERE r.nombre_rol IS NOT NULL), '{}') AS roles
    FROM usuarios u
    LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
    LEFT JOIN roles r        ON r.id_rol = ur.id_rol
`;

// Nunca devolver password_hash al cliente.
function sinPassword(usuario) {
  if (!usuario) return null;
  const { password_hash, ...resto } = usuario;
  return resto;
}

async function buscarPorEmail(email) {
  const { rows } = await db.query(
    `${SELECT_USUARIO} WHERE lower(u.email) = lower($1) GROUP BY u.id_usuario`,
    [email]
  );
  return rows[0] || null; // incluye password_hash, solo para uso interno (login)
}

async function buscarPorId(id) {
  const { rows } = await db.query(`${SELECT_USUARIO} WHERE u.id_usuario = $1 GROUP BY u.id_usuario`, [id]);
  return sinPassword(rows[0]);
}

// Crea el usuario, le asigna el rol y su fila en estudiantes/tutores, todo en una transacción.
async function crear({ nombre, apellido, email, passwordHash, carrera, semestre, rol }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, carrera, semestre)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_usuario`,
      [nombre, apellido, email, passwordHash, carrera, semestre]
    );
    const idUsuario = rows[0].id_usuario;

    const asignado = await client.query(
      `INSERT INTO usuario_rol (id_usuario, id_rol)
       SELECT $1, id_rol FROM roles WHERE nombre_rol = $2`,
      [idUsuario, rol]
    );
    if (asignado.rowCount !== 1) {
      throw new Error(`El rol "${rol}" no existe en la tabla roles. Ejecuta el script SQL del esquema.`);
    }

    if (rol === 'estudiante') {
      await client.query('INSERT INTO estudiantes (id_estudiante) VALUES ($1)', [idUsuario]);
    } else if (rol === 'tutor') {
      await client.query('INSERT INTO tutores (id_tutor) VALUES ($1)', [idUsuario]);
    }

    await client.query('COMMIT');
    return idUsuario;
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      // unique_violation: el email ya existe
      throw new HttpError(409, 'El email ya está registrado');
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { buscarPorEmail, buscarPorId, crear, sinPassword };
