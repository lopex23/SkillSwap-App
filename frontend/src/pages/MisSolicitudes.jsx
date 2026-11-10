import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import { Cargando, Estado, MensajeError, Pestanas, Vacio } from '../components/ui';
import { formatoFechaHora } from '../utils/formato';

const FILTROS = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'asignada', etiqueta: 'Asignadas' },
  { valor: 'cancelada', etiqueta: 'Canceladas' },
];

export default function MisSolicitudes() {
  const [estado, setEstado] = useState('');
  const [errorAccion, setErrorAccion] = useState(null);
  const { data, error, cargando, recargar } = useCarga(
    () => api(`/solicitudes/mias${estado ? `?estado=${estado}` : ''}`),
    [estado]
  );

  const cancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta solicitud?')) return;
    setErrorAccion(null);
    try {
      await api(`/solicitudes/${id}/cancelar`, { method: 'PATCH' });
      recargar();
    } catch (err) {
      setErrorAccion(err);
    }
  };

  return (
    <div className="pagina">
      <header className="pagina-cabecera con-accion">
        <div>
          <h1>Mis solicitudes</h1>
          <p className="texto-suave">Sigue el estado de tus pedidos de tutoría.</p>
        </div>
        <Link to="/solicitudes/nueva" className="btn btn-primario">
          Nueva solicitud
        </Link>
      </header>

      <Pestanas opciones={FILTROS} valor={estado} onChange={setEstado} />
      <MensajeError error={errorAccion} />
      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Cargando />}

      {data && data.solicitudes.length === 0 && (
        <Vacio titulo="No hay solicitudes aquí">
          <Link to="/solicitudes/nueva">Pide tu primera tutoría</Link>
        </Vacio>
      )}

      {data && data.solicitudes.length > 0 && (
        <ul className="lista">
          {data.solicitudes.map((s) => (
            <li key={s.id_solicitud} className="tarjeta item item-columna">
              <div className="item-fila">
                <div>
                  <p className="item-titulo">{s.materia.nombre_materia}</p>
                  <p className="texto-suave">Creada el {formatoFechaHora(s.fecha_solicitud)}</p>
                </div>
                <Estado valor={s.estado} />
              </div>
              <p className="item-descripcion">{s.descripcion}</p>
              <div className="item-fila">
                <p className="texto-suave">
                  {s.sesion
                    ? `Tutor: ${s.sesion.tutor}`
                    : `${s.tutores_sugeridos.length} tutor${s.tutores_sugeridos.length === 1 ? '' : 'es'} sugerido${s.tutores_sugeridos.length === 1 ? '' : 's'}`}
                </p>
                <div className="acciones">
                  <Link to={`/solicitudes/${s.id_solicitud}`} className="btn btn-sm btn-secundario">
                    Ver detalle
                  </Link>
                  {s.estado === 'pendiente' && (
                    <button type="button" className="btn btn-sm btn-peligro" onClick={() => cancelar(s.id_solicitud)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

