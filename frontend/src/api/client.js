// Cliente HTTP para la API de SkillSwap.
// Agrega el token JWT, convierte errores en ApiError y avisa cuando la sesión expiró.

const TOKEN_KEY = 'skillswap_token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* almacenamiento no disponible: la sesión dura solo esta pestaña */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nada que limpiar */
    }
  },
};

export class ApiError extends Error {
  constructor(status, message, errores) {
    super(message);
    this.status = status;
    this.errores = errores || {};
  }
}

const SIN_CONEXION = 'No se pudo conectar con el servidor. ¿Está corriendo el backend (npm run dev en /backend)?';

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, SIN_CONEXION);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Token vencido o inválido: se cierra la sesión en toda la app
    if (res.status === 401 && token) window.dispatchEvent(new Event('skillswap:logout'));
    // El proxy de Vite responde 5xx sin JSON cuando el backend está apagado
    if (!data && res.status >= 500) throw new ApiError(res.status, SIN_CONEXION);
    throw new ApiError(res.status, data?.message || 'Ocurrió un error inesperado', data?.errores);
  }
  return data;
}
