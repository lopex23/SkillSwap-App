import { useState } from 'react';
import { CircleAlert, Inbox, RotateCcw, Star } from 'lucide-react';
import { areaDe } from '../utils/areas';
import { capitalizar, iniciales, partesFecha } from '../utils/formato';

/* ---------- Estados de carga, error y vacío ---------- */

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}

// Bloques grises con la forma del contenido mientras carga
export function Esqueleto({ filas = 3, alto = 88 }) {
  return (
    <div className="esqueleto-lista" aria-hidden="true">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="esqueleto" style={{ height: alto }} />
      ))}
    </div>
  );
}

export function MensajeError({ error, onReintentar }) {
  if (!error) return null;
  return (
    <div className="alerta alerta-error" role="alert">
      <CircleAlert size={18} aria-hidden="true" />
      <span className="alerta-texto">{error.message || String(error)}</span>
      {onReintentar && (
        <button type="button" className="btn btn-sm btn-secundario" onClick={onReintentar}>
          <RotateCcw size={14} aria-hidden="true" /> Reintentar
        </button>
      )}
    </div>
  );
}

export function Alerta({ tipo = 'info', icono: Icono, children }) {
  return (
    <div className={`alerta alerta-${tipo}`}>
      {Icono && <Icono size={18} aria-hidden="true" />}
      <div className="alerta-texto">{children}</div>
    </div>
  );
}

export function Vacio({ titulo, children, icono: Icono = Inbox, accion }) {
  return (
    <div className="vacio">
      <span className="vacio-icono" aria-hidden="true">
        <Icono size={26} />
      </span>
      <p className="vacio-titulo">{titulo}</p>
      {children && <div className="vacio-texto">{children}</div>}
      {accion && <div className="vacio-accion">{accion}</div>}
    </div>
  );
}

/* ---------- Encabezados ---------- */

export function EncabezadoPagina({ titulo, descripcion, acciones, icono: Icono }) {
  return (
    <header className="pagina-cabecera">
      <div className="pagina-titulo">
        {Icono && (
          <span className="pagina-icono" aria-hidden="true">
            <Icono size={22} />
          </span>
        )}
        <div>
          <h1>{titulo}</h1>
          {descripcion && <p className="texto-suave">{descripcion}</p>}
        </div>
      </div>
      {acciones && <div className="acciones">{acciones}</div>}
    </header>
  );
}

/* ---------- Datos ---------- */

const TONO_ESTADO = {
  pendiente: 'aviso',
  programada: 'info',
  asignada: 'info',
  completada: 'exito',
  cancelada: 'neutro',
};

export function Estado({ valor }) {
  return (
    <span className={`badge badge-${TONO_ESTADO[valor] || 'neutro'}`}>
      <span className="badge-punto" aria-hidden="true" />
      {capitalizar(valor)}
    </span>
  );
}

export function Insignia({ tono = 'neutro', icono: Icono, children }) {
  return (
    <span className={`badge badge-${tono}`}>
      {Icono && <Icono size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Chip({ children, activo, onClick }) {
  if (onClick) {
    return (
      <button type="button" className={activo ? 'chip chip-boton activo' : 'chip chip-boton'} onClick={onClick} aria-pressed={activo}>
        {children}
      </button>
    );
  }
  return <span className="chip">{children}</span>;
}

// Avatar con iniciales y un degradado estable por persona
export function Avatar({ persona, id, tamano = 'md' }) {
  const n = Number(id ?? persona?.id_usuario ?? persona?.id_tutor ?? persona?.id_estudiante ?? 0);
  return (
    <span className={`avatar avatar-${tamano} avatar-g${n % 6}`} aria-hidden="true">
      {iniciales(persona)}
    </span>
  );
}

export function IconoArea({ codigo, tamano = 18 }) {
  const { Icono, tono, nombre } = areaDe(codigo);
  return (
    <span className={`area-icono area-${tono}`} title={nombre} aria-hidden="true">
      <Icono size={tamano} />
    </span>
  );
}

export function TarjetaDato({ icono: Icono, valor, etiqueta, tono = 'primario', detalle }) {
  return (
    <article className="tarjeta dato">
      <span className={`dato-icono tono-${tono}`} aria-hidden="true">
        <Icono size={20} />
      </span>
      <div>
        <p className="dato-valor">{valor}</p>
        <p className="dato-etiqueta">{etiqueta}</p>
        {detalle && <p className="dato-detalle">{detalle}</p>}
      </div>
    </article>
  );
}

// "Calendario" pequeño con día y mes
export function FechaTile({ iso }) {
  const { dia, mes, semana } = partesFecha(iso);
  return (
    <span className="fecha-tile" aria-hidden="true">
      <span className="fecha-semana">{semana}</span>
      <span className="fecha-dia">{dia}</span>
      <span className="fecha-mes">{mes}</span>
    </span>
  );
}

export function BarraProgreso({ valor, max = 100, etiqueta, degradado }) {
  const pct = Math.max(0, Math.min(100, (valor / max) * 100));
  return (
    <span
      className="barra"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiqueta}
    >
      <span className={degradado ? 'barra-relleno degradado' : 'barra-relleno'} style={{ width: `${pct}%` }} />
    </span>
  );
}

const NIVEL_PCT = { básico: 33, intermedio: 66, avanzado: 100 };

export function Nivel({ nivel }) {
  return (
    <span className="nivel">
      <BarraProgreso valor={NIVEL_PCT[nivel] ?? 50} etiqueta={`Nivel ${nivel}`} degradado />
      <span className="nivel-texto">{capitalizar(nivel)}</span>
    </span>
  );
}

const DIAS_CORTOS = [
  ['lunes', 'L'],
  ['martes', 'M'],
  ['miércoles', 'X'],
  ['jueves', 'J'],
  ['viernes', 'V'],
  ['sábado', 'S'],
  ['domingo', 'D'],
];

// Semana en miniatura con los días que el tutor tiene disponibles
export function SemanaMini({ disponibilidad = [] }) {
  const dias = new Set(disponibilidad.map((d) => d.dia_semana));
  return (
    <span className="semana-mini" aria-label={`Disponible: ${[...dias].join(', ') || 'sin horarios'}`}>
      {DIAS_CORTOS.map(([dia, letra]) => (
        <span key={dia} className={dias.has(dia) ? 'dia-mini activo' : 'dia-mini'} title={capitalizar(dia)}>
          {letra}
        </span>
      ))}
    </span>
  );
}

/* ---------- Valoraciones ---------- */

export function Estrellas({ valor, total, compacto, sinNumero }) {
  if (valor === null || valor === undefined) {
    return <span className="estrellas-vacio">Sin calificaciones aún</span>;
  }
  const n = Number(valor);
  return (
    <span className="estrellas" title={`${n.toFixed(1)} de 5`}>
      {compacto ? (
        <Star size={15} className="estrella llena" fill="currentColor" aria-hidden="true" />
      ) : (
        <span className="estrellas-fila" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={15}
              className={i <= Math.round(n) ? 'estrella llena' : 'estrella'}
              fill={i <= Math.round(n) ? 'currentColor' : 'none'}
            />
          ))}
        </span>
      )}
      {!sinNumero && <span className="estrellas-num">{n.toFixed(1)}</span>}
      {total !== undefined && (
        <span className="texto-suave">
          ({total} tutoría{total === 1 ? '' : 's'})
        </span>
      )}
    </span>
  );
}

const ETIQUETAS_PUNTUACION = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Excelente'];

export function EstrellasInput({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  const activo = hover || valor;
  return (
    <div className="estrellas-input-wrap">
      <div className="estrellas-input" role="radiogroup" aria-label="Puntuación" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={valor === i}
            aria-label={`${i} estrella${i === 1 ? '' : 's'}`}
            className={i <= activo ? 'estrella llena' : 'estrella'}
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange(i)}
          >
            <Star size={28} fill={i <= activo ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <span className="estrellas-input-texto">{ETIQUETAS_PUNTUACION[activo] || 'Elige una puntuación'}</span>
    </div>
  );
}

/* ---------- Formularios y navegación ---------- */

export function Campo({ label, error, children, ayuda }) {
  return (
    <label className={`campo${error ? ' campo-error' : ''}`}>
      <span className="campo-label">{label}</span>
      {children}
      {ayuda && !error && <span className="campo-ayuda">{ayuda}</span>}
      {error && <span className="campo-msg">{error}</span>}
    </label>
  );
}

export function Pestanas({ opciones, valor, onChange }) {
  return (
    <div className="pestanas" role="tablist">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="tab"
          aria-selected={valor === o.valor}
          className={valor === o.valor ? 'pestana activa' : 'pestana'}
          onClick={() => onChange(o.valor)}
        >
          {o.etiqueta}
          {o.cuenta !== undefined && <span className="pestana-cuenta">{o.cuenta}</span>}
        </button>
      ))}
    </div>
  );
}
