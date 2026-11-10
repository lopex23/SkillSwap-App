import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';

// Notificaciones emergentes (toasts) y diálogos de confirmación propios,
// en lugar de window.alert / window.confirm del navegador.

const UIContext = createContext(null);
const ICONOS = { exito: CircleCheck, error: CircleAlert, info: Info };

function Dialogo({ datos, onResponder }) {
  const botonRef = useRef(null);

  useEffect(() => {
    botonRef.current?.focus();
    const tecla = (e) => e.key === 'Escape' && onResponder(false);
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onResponder]);

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onResponder(false)}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="modal-titulo">
        <h2 id="modal-titulo">{datos.titulo}</h2>
        {datos.mensaje && <p className="texto-suave">{datos.mensaje}</p>}
        <div className="modal-acciones">
          <button type="button" className="btn btn-secundario" onClick={() => onResponder(false)}>
            {datos.cancelar || 'Volver'}
          </button>
          <button
            ref={botonRef}
            type="button"
            className={`btn ${datos.peligro ? 'btn-peligro-solido' : 'btn-primario'}`}
            onClick={() => onResponder(true)}
          >
            {datos.confirmar || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialogo, setDialogo] = useState(null);

  const quitar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const mostrar = useCallback(
    (tipo, mensaje) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, tipo, mensaje }]);
      setTimeout(() => quitar(id), tipo === 'error' ? 6000 : 4000);
    },
    [quitar]
  );

  // Uso: if (await confirmar({ titulo, mensaje, confirmar: 'Cancelar sesión', peligro: true })) { … }
  const confirmar = useCallback(
    (datos) => new Promise((resolve) => setDialogo({ ...datos, resolve })),
    []
  );

  const responder = useCallback(
    (ok) => {
      dialogo?.resolve(ok);
      setDialogo(null);
    },
    [dialogo]
  );

  const valor = useMemo(
    () => ({
      toast: {
        exito: (m) => mostrar('exito', m),
        error: (m) => mostrar('error', m),
        info: (m) => mostrar('info', m),
      },
      confirmar,
    }),
    [mostrar, confirmar]
  );

  return (
    <UIContext.Provider value={valor}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map(({ id, tipo, mensaje }) => {
          const Icono = ICONOS[tipo];
          return (
            <div key={id} className={`toast toast-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
              <Icono size={18} aria-hidden="true" />
              <span>{mensaje}</span>
              <button type="button" className="toast-cerrar" aria-label="Cerrar" onClick={() => quitar(id)}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
      {dialogo && <Dialogo datos={dialogo} onResponder={responder} />}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI debe usarse dentro de <UIProvider>');
  return ctx;
}
