const express = require('express');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.use(express.json());

app.use('/api/health', healthRoutes);

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada' });
});

// Manejador de errores centralizado
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
});

module.exports = app;
