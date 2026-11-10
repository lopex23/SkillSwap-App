// Error con código HTTP. El manejador de errores de app.js lo convierte en respuesta JSON.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = HttpError;
