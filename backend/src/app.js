const express = require('express');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const materiasRoutes = require('./routes/materias.routes');
const tutoresRoutes = require('./routes/tutores.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const sesionesRoutes = require('./routes/sesiones.routes');

const app = express();

app.use(express.json());

// Página de inicio: confirma que la API está viva y lista los endpoints
app.get('/', (req, res) => {
  res.json({
    nombre: 'SkillSwap API',
    status: 'ok',
    endpoints: {
      'GET /api/health': 'Estado del servidor',
      'GET /api/health/db': 'Prueba la conexión con la base de datos',
      'POST /api/auth/register': 'Registro de usuario',
      'POST /api/auth/login': 'Inicio de sesión',
      'GET /api/auth/me': 'Usuario actual (requiere token)',
      'GET /api/materias?q=': 'Lista/busca materias',
      'POST|PUT|DELETE /api/materias/:id': 'Gestión de materias (administrador)',
      'GET /api/tutores?materia=ID': 'Tutores, opcionalmente de una materia (requiere token)',
      'GET /api/tutores/:id': 'Perfil de un tutor (requiere token)',
      'GET /api/tutores/:id/calificaciones': 'Calificaciones anónimas del tutor (requiere token)',
      'GET|POST|DELETE /api/tutores/me/materias': 'Materias que enseña el tutor (tutor)',
      'GET|POST|DELETE /api/tutores/me/disponibilidad': 'Horarios del tutor (tutor)',
      'POST /api/solicitudes': 'Pedir una tutoría; calcula tutores sugeridos (estudiante)',
      'GET /api/solicitudes/mias?estado=': 'Mis solicitudes (estudiante)',
      'GET /api/solicitudes/disponibles': 'Solicitudes pendientes de mis materias (tutor)',
      'GET /api/solicitudes/:id': 'Detalle de una solicitud',
      'PATCH /api/solicitudes/:id/cancelar': 'Cancelar una solicitud pendiente (estudiante)',
      'POST /api/solicitudes/:id/aceptar': 'Aceptar y programar la sesión (tutor)',
      'GET /api/sesiones/mias?estado=&rol=': 'Mis sesiones como tutor y/o estudiante',
      'GET /api/sesiones/progreso': 'Sesiones completadas por materia (estudiante)',
      'GET /api/sesiones/:id': 'Detalle de una sesión (participantes)',
      'PATCH /api/sesiones/:id/completar': 'Marcar como completada (tutor asignado)',
      'PATCH /api/sesiones/:id/cancelar': 'Cancelar una sesión programada (tutor o estudiante)',
      'POST /api/sesiones/:id/calificar': 'Calificar de 1 a 5 una sesión completada (estudiante)',
    },
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/tutores', tutoresRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/sesiones', sesionesRoutes);

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada' });
});

// Manejador de errores centralizado
app.use((err, req, res, next) => {
  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'error', message: 'El cuerpo de la petición no es JSON válido' });
  }

  // Errores esperados (HttpError): se devuelve su mensaje
  if (err.status && err.status < 500) {
    const body = { status: 'error', message: err.message };
    if (err.details) body.errores = err.details;
    return res.status(err.status).json(body);
  }

  // Errores inesperados: se registran y no se exponen detalles al cliente
  console.error(err);
  res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
});

module.exports = app;
