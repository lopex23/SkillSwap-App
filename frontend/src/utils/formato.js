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

export const formatoFechaHora = (iso) => (iso ? fechaHora.format(new Date(iso)) : '—');
export const formatoFecha = (iso) => (iso ? soloFecha.format(new Date(iso)) : '—');

// "jue, 20 nov 2026, 3:00 p. m. – 4:30 p. m."
export function rangoSesion(inicio, fin) {
  return `${formatoFechaHora(inicio)} – ${soloHora.format(new Date(fin))}`;
}

export const nombreCompleto = (p) => (p ? `${p.nombre} ${p.apellido}` : '');

// Fecha local de hoy en formato YYYY-MM-DD (para el atributo min de <input type="date">)
export function hoyLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Minúsculas y sin tildes, para búsquedas: "Cálculo" → "calculo"
export const normalizar = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const capitalizar =(t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');
