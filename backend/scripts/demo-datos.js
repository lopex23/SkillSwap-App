// Datos de demostración para ver la app con contenido.
//
//   npm run demo:crear   → borra la demo anterior y crea usuarios, solicitudes,
//                          sesiones y calificaciones de ejemplo
//   npm run demo:borrar  → elimina todo lo creado por la demo
//
// Requiere el backend corriendo (npm run dev) porque crea los datos a través de
// la API, aplicando las mismas reglas que la app (matching, reputación, progreso).
//
// Todas las cuentas usan el dominio @demo.skillswap.test y la contraseña DEMO_PASSWORD.
require('dotenv').config({ quiet: true });

const { pool } = require('../src/config/db');

const API = process.env.DEMO_API_URL || `http://localhost:${process.env.PORT || 3000}/api`;
const DOMINIO = '@demo.skillswap.test';
const DEMO_PASSWORD = 'SkillSwapDemo2026';

const TUTORES = [
  {
    clave: 'valentina', nombre: 'Valentina', apellido: 'Ríos', carrera: 'Ingeniería de Sistemas', semestre: 9,
    materias: [['MAT-101', 'avanzado'], ['ING-101', 'avanzado'], ['ING-201', 'intermedio']],
    horarios: [['lunes', '14:00', '17:00'], ['miércoles', '10:00', '12:00'], ['viernes', '15:00', '18:00']],
  },
  {
    clave: 'andres', nombre: 'Andrés', apellido: 'Gómez', carrera: 'Derecho', semestre: 8,
    materias: [['DER-101', 'avanzado'], ['DER-201', 'avanzado'], ['INV-101', 'intermedio']],
    horarios: [['martes', '09:00', '11:00'], ['jueves', '16:00', '18:00']],
  },
  {
    clave: 'camila', nombre: 'Camila', apellido: 'Herrera', carrera: 'Psicología', semestre: 7,
    materias: [['PSI-101', 'avanzado'], ['PSI-201', 'intermedio'], ['EST-101', 'intermedio']],
    horarios: [['lunes', '08:00', '10:00'], ['miércoles', '14:00', '16:00']],
  },
  {
    clave: 'santiago', nombre: 'Santiago', apellido: 'Pérez', carrera: 'Contaduría Pública', semestre: 8,
    materias: [['CON-101', 'avanzado'], ['FIN-101', 'avanzado'], ['ECO-101', 'intermedio']],
    horarios: [['martes', '14:00', '16:00'], ['sábado', '09:00', '12:00']],
  },
  {
    clave: 'isabella', nombre: 'Isabella', apellido: 'Torres', carrera: 'Licenciatura en Inglés', semestre: 6,
    materias: [['IDI-101', 'avanzado'], ['IDI-102', 'avanzado'], ['COM-101', 'básico']],
    horarios: [],
  },
];

const ESTUDIANTES = [
  { clave: 'mateo', nombre: 'Mateo', apellido: 'Rodríguez', carrera: 'Ingeniería Civil', semestre: 2 },
  { clave: 'sofia', nombre: 'Sofía', apellido: 'Martínez', carrera: 'Psicología', semestre: 1 },
  { clave: 'daniel', nombre: 'Daniel', apellido: 'Castro', carrera: 'Administración de Empresas', semestre: 3 },
  { clave: 'laura', nombre: 'Laura', apellido: 'Jiménez', carrera: 'Derecho', semestre: 2 },
];

// Sesiones ya realizadas: [estudiante, tutor, materia, descripción, días atrás, puntuación, comentario]
const COMPLETADAS = [
  ['mateo', 'valentina', 'MAT-101', 'No entiendo la regla de la cadena ni las derivadas implícitas.', 12, 5, 'Me explicó la regla de la cadena con muchos ejemplos. ¡Pasé el parcial!'],
  ['mateo', 'valentina', 'ING-101', 'Necesito ayuda con ciclos y funciones en Python para el taller.', 6, 5, 'Muy paciente, resolvimos todos los ejercicios del taller.'],
  ['laura', 'valentina', 'MAT-101', 'Me cuesta graficar funciones y encontrar dominios.', 10, 5, 'Explica con calma y te deja ejercicios para practicar.'],
  ['sofia', 'camila', 'PSI-101', 'Quiero repasar las corrientes de la psicología para el primer parcial.', 9, 4, 'Me ayudó a organizar el tema en un mapa conceptual.'],
  ['sofia', 'camila', 'EST-101', 'No me quedan claras las medidas de dispersión.', 4, 5, null],
  ['daniel', 'santiago', 'CON-101', 'Me confunden los asientos contables de débito y crédito.', 8, 5, 'Claro y práctico, con ejemplos de empresas reales.'],
  ['laura', 'andres', 'DER-101', 'Necesito entender las fuentes del derecho para la exposición.', 5, 4, 'Muy buen dominio del tema.'],
  ['daniel', 'santiago', 'FIN-101', 'Quiero practicar interés compuesto y anualidades.', 2, null, null], // sin calificar
];

// Sesiones futuras: [estudiante, tutor, materia, descripción, días adelante, hora, minutos, modalidad]
const PROGRAMADAS = [
  ['mateo', 'valentina', 'MAT-101', 'Repaso de límites al infinito antes del examen final.', 2, 16, 90, 'virtual'],
  ['sofia', 'camila', 'PSI-201', 'Tengo dudas sobre las etapas del desarrollo de Piaget.', 1, 10, 60, 'presencial'],
  ['laura', 'andres', 'DER-201', 'Quiero preparar el control de constitucionalidad para el parcial.', 3, 17, 60, 'virtual'],
];

// Solicitudes que siguen esperando tutor
const PENDIENTES = [
  ['laura', 'ING-101', 'Quiero aprender lo básico de Python: variables, condicionales y ciclos.'],
  ['mateo', 'FIS-101', 'Necesito ayuda con cinemática: movimiento parabólico y caída libre.'],
  ['daniel', 'ECO-101', 'No entiendo la elasticidad precio de la demanda.'],
  ['laura', 'INV-101', 'Debo plantear la pregunta de investigación y el marco teórico.'],
  ['sofia', 'IDI-101', 'Quiero practicar conversación en inglés para la presentación oral.'],
];

const CANCELADAS = [['daniel', 'ADM-101', 'Necesitaba ayuda con el proceso administrativo (ya no la necesito).']];

async function llamar(metodo, ruta, body, token) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const datos = r.status === 204 ? null : await r.json();
  if (!r.ok) throw new Error(`${metodo} ${ruta} → ${r.status}: ${datos?.message}`);
  return datos;
}

// Fecha ISO en hora de Colombia, N días desde hoy
function fecha(dias, hora, minutos = 0) {
  const d = new Date(Date.now() + dias * 86400000);
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(d);
  return `${ymd}T${pad(hora)}:${pad(minutos)}:00-05:00`;
}

async function borrar() {
  const { rows } = await pool.query('SELECT id_usuario FROM usuarios WHERE email LIKE $1', [`%${DOMINIO}`]);
  const ids = rows.map((r) => r.id_usuario);
  if (ids.length === 0) return 0;
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const ses = `SELECT se.id_sesion FROM sesiones_tutoria se JOIN solicitudes_tutoria s ON s.id_solicitud = se.id_solicitud
                  WHERE s.id_estudiante = ANY($1) OR se.id_tutor = ANY($1)`;
    const sol = 'SELECT id_solicitud FROM solicitudes_tutoria WHERE id_estudiante = ANY($1)';
    for (const t of ['calificaciones', 'historial_tutorias', 'archivos_compartidos']) {
      await c.query(`DELETE FROM ${t} WHERE id_sesion IN (${ses})`, [ids]);
    }
    await c.query(`DELETE FROM sesiones_tutoria WHERE id_sesion IN (${ses})`, [ids]);
    await c.query(`DELETE FROM matching_tutor WHERE id_solicitud IN (${sol}) OR id_tutor = ANY($1)`, [ids]);
    await c.query('DELETE FROM progreso_estudiante WHERE id_estudiante = ANY($1)', [ids]);
    await c.query('DELETE FROM solicitudes_tutoria WHERE id_estudiante = ANY($1)', [ids]);
    for (const [t, col] of [
      ['disponibilidad_tutor', 'id_tutor'],
      ['usuario_materia', 'id_usuario'],
      ['notificaciones', 'id_usuario'],
      ['reportes', 'id_usuario'],
      ['usuario_rol', 'id_usuario'],
      ['estudiantes', 'id_estudiante'],
      ['tutores', 'id_tutor'],
    ]) {
      await c.query(`DELETE FROM ${t} WHERE ${col} = ANY($1)`, [ids]);
    }
    await c.query('DELETE FROM mensajes WHERE id_remitente = ANY($1) OR id_destinatario = ANY($1)', [ids]);
    const d = await c.query('DELETE FROM usuarios WHERE id_usuario = ANY($1)', [ids]);
    await c.query('COMMIT');
    return d.rowCount;
  } catch (err) {
    await c.query('ROLLBACK');
    throw err;
  } finally {
    c.release();
  }
}

async function crear() {
  const borrados = await borrar();
  if (borrados) console.log(`Demo anterior borrada (${borrados} usuarios).`);

  const { materias } = await llamar('GET', '/materias');
  const idMateria = (codigo) => {
    const m = materias.find((x) => x.codigo_materia === codigo);
    if (!m) throw new Error(`No existe la materia ${codigo}. Ejecuta el script SQL del esquema.`);
    return m.id_materia;
  };

  const u = {};
  const registrar = async (p, rol) => {
    const d = await llamar('POST', '/auth/register', {
      nombre: p.nombre, apellido: p.apellido, carrera: p.carrera, semestre: p.semestre,
      email: `${p.clave}${DOMINIO}`, password: DEMO_PASSWORD, rol,
    });
    u[p.clave] = { id: d.usuario.id_usuario, token: d.token };
  };

  for (const t of TUTORES) {
    await registrar(t, 'tutor');
    for (const [codigo, nivel] of t.materias) {
      await llamar('POST', '/tutores/me/materias', { id_materia: idMateria(codigo), nivel }, u[t.clave].token);
    }
    for (const [dia_semana, hora_inicio, hora_fin] of t.horarios) {
      await llamar('POST', '/tutores/me/disponibilidad', { dia_semana, hora_inicio, hora_fin }, u[t.clave].token);
    }
  }
  for (const e of ESTUDIANTES) await registrar(e, 'estudiante');

  // Administrador de demostración (estudiante + administrador)
  await registrar({ clave: 'admin', nombre: 'Admin', apellido: 'Demo', carrera: null, semestre: null }, 'estudiante');
  await pool.query(
    `INSERT INTO usuario_rol (id_usuario, id_rol) SELECT $1, id_rol FROM roles WHERE nombre_rol = 'administrador' ON CONFLICT DO NOTHING`,
    [u.admin.id]
  );

  // Pide y acepta una tutoría; devuelve el id de la sesión
  const pedirYAceptar = async (est, tut, codigo, descripcion, inicio, minutos, modalidad) => {
    const { solicitud } = await llamar('POST', '/solicitudes', { id_materia: idMateria(codigo), descripcion }, u[est].token);
    const fin = new Date(new Date(inicio).getTime() + minutos * 60000).toISOString();
    const r = await llamar('POST', `/solicitudes/${solicitud.id_solicitud}/aceptar`, { fecha_inicio: inicio, fecha_fin: fin, modalidad }, u[tut].token);
    return r.solicitud.sesion.id_sesion;
  };

  // Completadas: se programan en el futuro y luego se mueven al pasado para poder completarlas
  let separacion = 30;
  for (const [est, tut, codigo, descripcion, diasAtras, puntuacion, comentario] of COMPLETADAS) {
    const id = await pedirYAceptar(est, tut, codigo, descripcion, fecha(separacion++, 15), 60, 'virtual');
    // 3:00–4:00 p. m. hora de Colombia, N días atrás; la solicitud se envió 2 días antes
    await pool.query(
      `WITH base AS (
         SELECT (date_trunc('day', now() AT TIME ZONE 'America/Bogota')
                 - make_interval(days => $2) + interval '15 hours') AT TIME ZONE 'America/Bogota' AS inicio
       )
       UPDATE sesiones_tutoria
          SET fecha_inicio = base.inicio, fecha_fin = base.inicio + interval '1 hour'
         FROM base
        WHERE id_sesion = $1`,
      [id, diasAtras]
    );
    await pool.query(
      `UPDATE solicitudes_tutoria s SET fecha_solicitud = se.fecha_inicio - interval '2 days 3 hours'
         FROM sesiones_tutoria se WHERE se.id_solicitud = s.id_solicitud AND se.id_sesion = $1`,
      [id]
    );
    await llamar('PATCH', `/sesiones/${id}/completar`, null, u[tut].token);
    if (puntuacion) await llamar('POST', `/sesiones/${id}/calificar`, { puntuacion, comentario }, u[est].token);
  }

  for (const [est, tut, codigo, descripcion, dias, hora, minutos, modalidad] of PROGRAMADAS) {
    await pedirYAceptar(est, tut, codigo, descripcion, fecha(dias, hora), minutos, modalidad);
  }

  // Pendientes enviadas hace unas horas (distintas antigüedades)
  for (const [i, [est, codigo, descripcion]] of PENDIENTES.entries()) {
    const { solicitud } = await llamar('POST', '/solicitudes', { id_materia: idMateria(codigo), descripcion }, u[est].token);
    await pool.query(
      `UPDATE solicitudes_tutoria SET fecha_solicitud = now() - make_interval(hours => $2) WHERE id_solicitud = $1`,
      [solicitud.id_solicitud, (i + 1) * 5]
    );
  }

  for (const [est, codigo, descripcion] of CANCELADAS) {
    const { solicitud } = await llamar('POST', '/solicitudes', { id_materia: idMateria(codigo), descripcion }, u[est].token);
    await llamar('PATCH', `/solicitudes/${solicitud.id_solicitud}/cancelar`, null, u[est].token);
  }

  console.log('✅ Datos de demostración creados:');
  console.log(`   ${TUTORES.length} tutores, ${ESTUDIANTES.length} estudiantes y 1 administrador`);
  console.log(`   ${COMPLETADAS.length} sesiones completadas, ${PROGRAMADAS.length} programadas, ${PENDIENTES.length} solicitudes pendientes, ${CANCELADAS.length} cancelada`);
  console.log(`   Cuentas: <nombre>${DOMINIO} (valentina, andres, camila, santiago, isabella, mateo, sofia, daniel, laura, admin)`);
  console.log('   Contraseña: la constante DEMO_PASSWORD de backend/scripts/demo-datos.js');
}

(async () => {
  const accion = process.argv[2];
  try {
    if (accion === 'crear') await crear();
    else if (accion === 'borrar') console.log(`🗑️  Usuarios de demostración borrados: ${await borrar()}`);
    else console.log('Uso: node scripts/demo-datos.js crear|borrar');
  } catch (err) {
    console.error('❌', err.message);
    if (err.cause?.code === 'ECONNREFUSED') console.error('   ¿Está corriendo el backend? (npm run dev)');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
