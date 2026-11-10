import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, CalendarClock, MapPin, Sparkles, Video } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import { useUI } from '../context/UIContext';
import AceptarSolicitud from '../components/AceptarSolicitud';
import LineaSolicitud from '../components/LineaSolicitud';
import {
  Avatar,
  BarraProgreso,
  Esqueleto,
  Estado,
  Estrellas,
  FechaTile,
  IconoArea,
  MensajeError,
  Vacio,
} from '../components/ui';
import { formatoFechaHora, nombreCompleto, rangoHoras } from '../utils/formato';

export default function SolicitudDetalle() {
  const { id } = useParams();
  const { usuario, tieneRol } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();
  const { data, error, cargando, recargar } = useCarga(() => api(`/solicitudes/${id}`), [id]);

  if (cargando) return <Esqueleto filas={3} alto={140} />;
  if (error) {
    return error.status === 404 ? (
      <Vacio titulo="Solicitud no encontrada" accion={<Link to="/panel">Volver al inicio</Link>} />
    ) : (
      <MensajeError error={error} onReintentar={recargar} />
    );
  }

  const s = data.solicitud;
  const esDueno = s.estudiante.id_estudiante === usuario.id_usuario;
  const puedeAceptar = !esDueno && tieneRol('tutor') && s.estado === 'pendiente';
  const Modalidad = s.sesion?.modalidad === 'virtual' ? Video : MapPin;

  return (
    <div className="pagina pagina-estrecha">
      <Link to={esDueno ? '/solicitudes' : '/disponibles'} className="volver">
        <ArrowLeft size={16} /> {esDueno ? 'Mis solicitudes' : 'Solicitudes disponibles'}
      </Link>

      <article className="tarjeta" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="fila-entre">
          <div className="fila">
            <IconoArea codigo={s.materia.codigo_materia} tamano={22} />
            <div className="apilado">
              <span className="codigo">{s.materia.codigo_materia}</span>
              <h1>{s.materia.nombre_materia}</h1>
            </div>
          </div>
          <Estado valor={s.estado} />
        </div>

        <LineaSolicitud solicitud={s} />

        <div className="panel-accion">
          <p className="descripcion">{s.descripcion}</p>
          <div className="fila">
            {!esDueno && <Avatar persona={s.estudiante} id={s.estudiante.id_estudiante} tamano="sm" />}
            <span className="texto-suave">
              {esDueno ? 'Enviada' : `Pedida por ${nombreCompleto(s.estudiante)}`}
              {!esDueno && s.estudiante.carrera ? ` · ${s.estudiante.carrera}` : ''}
              {!esDueno && s.estudiante.semestre ? ` · semestre ${s.estudiante.semestre}` : ''} · {formatoFechaHora(s.fecha_solicitud)}
            </span>
          </div>
        </div>
      </article>

      {s.sesion && (
        <section className="tarjeta">
          <div className="tarjeta-cabecera">
            <h2>
              <CalendarCheck size={18} /> Sesión
            </h2>
            <Estado valor={s.sesion.estado} />
          </div>
          <div className="sesion-item">
            <FechaTile iso={s.sesion.fecha_inicio} />
            <div className="sesion-cuerpo">
              <span className="titulo-item">Con {s.sesion.tutor}</span>
              <span className="meta">
                <span>
                  <CalendarClock size={14} /> {rangoHoras(s.sesion.fecha_inicio, s.sesion.fecha_fin)}
                </span>
                <span>
                  <Modalidad size={14} /> {s.sesion.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                </span>
              </span>
              <div>
                <Link to="/sesiones" className="btn btn-secundario btn-sm">
                  Ir a mis sesiones
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {puedeAceptar && (
        <section className="tarjeta">
          <div className="tarjeta-cabecera">
            <h2>
              <CalendarCheck size={18} /> Aceptar esta solicitud
            </h2>
          </div>
          <p className="texto-suave" style={{ marginBottom: '0.5rem' }}>
            Elige cuándo y cómo será la sesión. El estudiante la verá de inmediato en su panel.
          </p>
          <AceptarSolicitud
            idSolicitud={s.id_solicitud}
            onAceptada={() => {
              toast.exito('¡Sesión programada!');
              navigate('/sesiones');
            }}
          />
        </section>
      )}

      {esDueno && s.estado === 'pendiente' && (
        <section className="seccion">
          <div className="seccion-cabecera">
            <h2>
              <Sparkles size={18} style={{ verticalAlign: '-3px' }} /> Tutores sugeridos
            </h2>
          </div>
          {s.tutores_sugeridos.length === 0 ? (
            <Vacio titulo="Aún no hay tutores para esta materia">
              Cualquier tutor que agregue la materia podrá ver y aceptar tu solicitud.
            </Vacio>
          ) : (
            <ul className="lista">
              {s.tutores_sugeridos.map((t) => {
                const pct = Math.round(Number(t.puntaje_match) * 100);
                return (
                  <li key={t.id_tutor} className="tarjeta tarjeta-interactiva fila-entre" style={{ alignItems: 'center' }}>
                    <span className="fila">
                      <Avatar persona={t} id={t.id_tutor} />
                      <span className="apilado">
                        <Link to={`/tutores/${t.id_tutor}`} className="titulo-item">
                          {nombreCompleto(t)}
                        </Link>
                        <Estrellas valor={t.reputacion_promedio} total={t.total_tutorias ?? 0} />
                      </span>
                    </span>
                    <span className="match" title="Afinidad según reputación, nivel en la materia y horarios">
                      <BarraProgreso valor={pct} degradado etiqueta="Afinidad" />
                      <span className="match-num">{pct}%</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="texto-suave">
            La afinidad combina la reputación del tutor (50 %), su nivel en la materia (30 %) y si tiene horarios registrados
            (20 %).
          </p>
        </section>
      )}
    </div>
  );
}
