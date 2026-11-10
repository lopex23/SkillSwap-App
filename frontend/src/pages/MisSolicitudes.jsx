import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CirclePlus, ClipboardList, Clock } from 'lucide-react';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import { useUI } from '../context/UIContext';
import { Avatar, EncabezadoPagina, Esqueleto, Estado, IconoArea, MensajeError, Pestanas, Vacio } from '../components/ui';
import LineaSolicitud from '../components/LineaSolicitud';
import { tiempoRelativo } from '../utils/formato';

export default function MisSolicitudes() {
  const { toast, confirmar } = useUI();
  const [estado, setEstado] = useState('');
  const { data, error, cargando, recargar } = useCarga(() => api('/solicitudes/mias'), []);

  const todas = data?.solicitudes ?? [];
  const filtradas = useMemo(() => (estado ? todas.filter((s) => s.estado === estado) : todas), [todas, estado]);
  const cuenta = (e) => todas.filter((s) => s.estado === e).length;

  const cancelar = async (s) => {
    const ok = await confirmar({
      titulo: '¿Cancelar esta solicitud?',
      mensaje: `Dejará de estar visible para los tutores de ${s.materia.nombre_materia}.`,
      confirmar: 'Cancelar solicitud',
      cancelar: 'Mantener',
      peligro: true,
    });
    if (!ok) return;
    try {
      await api(`/solicitudes/${s.id_solicitud}/cancelar`, { method: 'PATCH' });
      toast.exito('Solicitud cancelada.');
      recargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="pagina">
      <EncabezadoPagina
        icono={ClipboardList}
        titulo="Mis solicitudes"
        descripcion="Sigue el estado de tus pedidos de tutoría."
        acciones={
          <Link to="/solicitudes/nueva" className="btn btn-primario">
            <CirclePlus size={17} /> Nueva solicitud
          </Link>
        }
      />

      <Pestanas
        opciones={[
          { valor: '', etiqueta: 'Todas', cuenta: todas.length },
          { valor: 'pendiente', etiqueta: 'Pendientes', cuenta: cuenta('pendiente') },
          { valor: 'asignada', etiqueta: 'Asignadas', cuenta: cuenta('asignada') },
          { valor: 'cancelada', etiqueta: 'Canceladas', cuenta: cuenta('cancelada') },
        ]}
        valor={estado}
        onChange={setEstado}
      />

      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Esqueleto filas={3} alto={150} />}

      {data && filtradas.length === 0 && (
        <Vacio
          icono={ClipboardList}
          titulo={estado ? 'No hay solicitudes en esta categoría' : 'Aún no has pedido tutorías'}
          accion={
            <Link to="/solicitudes/nueva" className="btn btn-primario btn-sm">
              <CirclePlus size={16} /> Pedir mi primera tutoría
            </Link>
          }
        />
      )}

      {filtradas.length > 0 && (
        <ul className="lista">
          {filtradas.map((s) => (
            <li key={s.id_solicitud} className="tarjeta" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="fila-entre">
                <div className="fila">
                  <IconoArea codigo={s.materia.codigo_materia} />
                  <div className="apilado">
                    <Link to={`/solicitudes/${s.id_solicitud}`} className="titulo-item">
                      {s.materia.nombre_materia}
                    </Link>
                    <span className="meta">
                      <span>
                        <Clock size={13} /> Enviada {tiempoRelativo(s.fecha_solicitud)}
                      </span>
                    </span>
                  </div>
                </div>
                <Estado valor={s.estado} />
              </div>

              <p className="descripcion" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {s.descripcion}
              </p>

              <LineaSolicitud solicitud={s} />

              <div className="fila-entre" style={{ alignItems: 'center' }}>
                {s.sesion ? (
                  <span className="texto-suave">Tutor: {s.sesion.tutor}</span>
                ) : s.tutores_sugeridos.length > 0 ? (
                  <span className="fila">
                    <span className="pila-avatares">
                      {s.tutores_sugeridos.slice(0, 4).map((t) => (
                        <Avatar key={t.id_tutor} persona={t} id={t.id_tutor} tamano="sm" />
                      ))}
                    </span>
                    <span className="texto-suave">
                      {s.tutores_sugeridos.length} tutor{s.tutores_sugeridos.length === 1 ? '' : 'es'} sugerido
                      {s.tutores_sugeridos.length === 1 ? '' : 's'}
                    </span>
                  </span>
                ) : (
                  <span className="texto-suave">Esperando a que un tutor agregue la materia</span>
                )}
                <div className="acciones">
                  {s.estado === 'pendiente' && (
                    <button type="button" className="btn btn-peligro btn-sm" onClick={() => cancelar(s)}>
                      Cancelar
                    </button>
                  )}
                  <Link to={`/solicitudes/${s.id_solicitud}`} className="btn btn-secundario btn-sm">
                    Ver detalle <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
