import { useState } from 'react';
import { capitalizar } from '../utils/formato';

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}

export function MensajeError({ error, onReintentar }) {
  if (!error) return null;
  return (
    <div className="alerta alerta-error" role="alert">
      <span>{error.message || String(error)}</span>
      {onReintentar && (
        <button type="button" className="btn btn-sm btn-secundario" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function Exito({ children }) {
  if (!children) return null;
  return (
    <div className="alerta alerta-exito" role="status">
      {children}
    </div>
  );
}

export function Vacio({ titulo, children }) {
  return (
    <div className="vacio">
      <p className="vacio-titulo">{titulo}</p>
      {children && <div className="vacio-texto">{children}</div>}
    </div>
  );
}

const TONO_ESTADO = {
  pendiente: 'aviso',
  programada: 'info',
  asignada: 'info',
  completada: 'exito',
  cancelada: 'neutro',
};

export function Estado({ valor }) {
  return <span className={`badge badge-${TONO_ESTADO[valor] || 'neutro'}`}>{capitalizar(valor)}</span>;
}

export function Chip({ children }) {
  return <span className="chip">{children}</span>;
}

// Muestra la reputación como estrellas (solo lectura)
export function Estrellas({ valor, total }) {
  if (valor === null || valor === undefined) {
    return <span className="estrellas-vacio">Sin calificaciones</span>;
  }
  const n = Number(valor);
  return (
    <span className="estrellas" title={`${n.toFixed(1)} de 5`}>
      <span aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= Math.round(n) ? 'estrella llena' : 'estrella'}>
            ★
          </span>
        ))}
      </span>
      <span className="estrellas-num">{n.toFixed(1)}</span>
      {total !== undefined && <span className="texto-suave"> · {total} tutoría{total === 1 ? '' : 's'}</span>}
    </span>
  );
}

// Selector de 1 a 5 estrellas
export function EstrellasInput({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="estrellas-input" role="radiogroup" aria-label="Puntuación" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={valor === i}
          aria-label={`${i} estrella${i === 1 ? '' : 's'}`}
          className={i <= (hover || valor) ? 'estrella llena' : 'estrella'}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// Etiqueta + control + error del campo
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
        </button>
      ))}
    </div>
  );
}
