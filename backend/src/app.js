const express = require('express');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');

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
    },
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

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
