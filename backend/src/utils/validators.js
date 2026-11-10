const HttpError = require('./httpError');

// Devuelve el string sin espacios a los lados, o '' si no es string.
function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// Convierte un parámetro de ruta/query a entero positivo o lanza 400.
function parseId(valor, nombre = 'id') {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new HttpError(400, `El parámetro "${nombre}" debe ser un número entero positivo`);
  }
  return n;
}

// Lanza 400 con el detalle por campo si hay errores.
function assertSinErrores(errores, mensaje = 'Datos inválidos') {
  if (Object.keys(errores).length > 0) {
    throw new HttpError(400, mensaje, errores);
  }
}

module.exports = { texto, parseId, assertSinErrores };
