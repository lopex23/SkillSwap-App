const fechaHora = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const soloHora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' });
const soloFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const fechaLarga = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const diaSemanaCorto = new Intl.DateTimeFormat('es-CO', { weekday: 'short' });
const mesCorto = new Intl.DateTimeFormat('es-CO', { month: 'short' });

export const formatoFechaHora = (iso) => (iso ? fechaHora.format(new Date(iso)) : '—');
export const formatoFecha = (iso) => (iso ? soloFecha.format(new Date(iso)) : '—');
export const formatoHora = (iso) => (iso ? soloHora.format(new Date(iso)) : '—');
export const formatoFechaLarga = (d = new Date()) => capitalizar(fechaLarga.format(d));

// "jue, 20 nov 2026, 3:00 p. m. – 4:30 p. m."
export function rangoSesion(inicio, fin) {
  return `${formatoFechaHora(inicio)} – ${soloHora.format(new Date(fin))}`;
}

export const rangoHoras = (inicio, fin) => `${formatoHora(inicio)} – ${formatoHora(fin)}`;

// Partes para el "calendario" de las tarjetas: { dia: '12', mes: 'nov', semana: 'jue' }
export function partesFecha(iso) {
  const d = new Date(iso);
  return {
    dia: String(d.getDate()),
    mes: mesCorto.format(d).replace('.', ''),
    semana: diaSemanaCorto.format(d).replace('.', ''),
  };
}

export const nombreCompleto = (p) => (p ? `${p.nombre} ${p.apellido}` : '');
export const iniciales = (p) => (p ? `${p.nombre?.[0] ?? ''}${p.apellido?.[0] ?? ''}`.toUpperCase() : '?');

// Fecha local de hoy en formato YYYY-MM-DD (para el atributo min de <input type="date">)
export function hoyLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');

// Minúsculas y sin tildes, para búsquedas: "Cálculo" → "calculo"
export const normalizar = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

// "hace 5 minutos", "en 2 días", "mañana"
export function tiempoRelativo(iso) {
  const diff = (new Date(iso) - new Date()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return 'ahora';
  if (abs < 3600) return relativo.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return relativo.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return relativo.format(Math.round(diff / 86400), 'day');
  return formatoFecha(iso);
}

// Etiqueta de grupo para listas por día: "Hoy", "Mañana", "Ayer" o "jueves 12 de noviembre"
export function etiquetaDia(iso) {
  const d = new Date(iso);
  const hoy = new Date();
  const inicio = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((inicio(d) - inicio(hoy)) / 86400000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  if (dias === -1) return 'Ayer';
  return capitalizar(fechaLarga.format(d));
}

// Estado temporal de una sesión programada
export function momentoSesion(inicio, fin) {
  const ahora = new Date();
  if (ahora < new Date(inicio)) return 'futura';
  if (ahora <= new Date(fin)) return 'en-curso';
  return 'pasada';
}

export const plural = (n, singular, pluralTxt = `${singular}s`) => `${n} ${n === 1 ? singular : pluralTxt}`;
