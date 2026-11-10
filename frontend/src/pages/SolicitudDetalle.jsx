import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import AceptarSolicitud from '../components/AceptarSolicitud';
import { Cargando, Estado, Estrellas, Exito, MensajeError, Vacio } from '../components/ui';
import { formatoFechaHora, nombreCompleto, rangoSesion } from '../utils/formato';

export default function SolicitudDetalle() {
  const { id } = useParams();
  const { usuario, tieneRol } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, error, cargando, recargar } = useCarga(() => api(`/solicitudes/${id}`), [id]);

  if (cargando) return <Cargando />;
  if (error) {
    return error.status === 404 ? (
      <Vacio titulo="Solicitud no encontrada">
        <Link to="/panel">Volver al inicio</Link>
      </Vacio>
    ) : (
      <MensajeError error={error} onReintentar={recargar} />
    );
  }

  const s = data.solicitud;
  const esDueno = s.estudiante.id_estudiante === usuario.id_usuario;
  const puedeAceptar = !esDueno && tieneRol('tutor') && s.estado === 'pendiente';

  return (
    <div className="pagina pagina-estrecha">
      <Link to={esDueno ? '/solicitudes' : '/disponibles'} className="volver">
        ← Volver
      </Link>

      {location.state?.recienCreada && (
        <Exito>¡Solicitud enviada! Los tutores de esta materia ya pueden verla y aceptarla.</Exito>
      )}

      <article className="tarjeta">
        <div className="item-fila">
          <div>
            <p className="texto-suave">{s.materia.codigo_materia}</p>
            <h1 className="titulo-tarjeta">{s.materia.nombre_materia}</h1>
          </div>
          <Estado valor={s.estado} />
        </div>
        <p className="item-descripcion">{s.descripcion}</p>
        <p className="texto-suave">
          {esDueno ? 'Creada' : `Pedida por ${nombreCompleto(s.estudiante)}`}
          {!esDueno && s.estudiante.carrera ? ` · ${s.estudiante.carrera}` : ''}
          {!esDueno && s.estudiante.semestre ? ` · semestre ${s.estudiante.semestre}` : ''}
          {' · '}
          {formatoFechaHora(s.fecha_solicitud)}
        </p>
      </article>

      {s.sesion && (
        <section className="tarjeta">
          <h2>Sesión</h2>
          <div className="item-fila">
            <div>
              <p className="item-titulo">Con {s.sesion.tutor}</p>
              <p className="texto-suave">
                {rangoSesion(s.sesion.fecha_inicio, s.sesion.fecha_fin)} · {s.sesion.modalidad}
              </p>
            </div>
            <Estado valor={s.sesion.estado} />
          </div>
          <Link to="/sesiones" className="btn btn-sm btn-secundario">
            Ir a mis sesiones
          </Link>
        </section>
      )}

      {puedeAceptar && (
        <section className="tarjeta">
          <h2>Aceptar esta solicitud</h2>
          <p className="texto-suave">Elige cuándo y cómo será la sesión.</p>
          <AceptarSolicitud idSolicitud={s.id_solicitud} onAceptada={() => navigate('/sesiones')} />
        </section>
      )}

      {esDueno && (
        <section className="seccion">
          <h2>Tutores sugeridos</h2>
          {s.tutores_sugeridos.length === 0 ? (
            <Vacio titulo="Aún no hay tutores para esta materia">
              Cualquier tutor que agregue la materia podrá ver y aceptar tu solicitud.
            </Vacio>
          ) : (
            <ul className="lista">
              {s.tutores_sugeridos.map((t) => (
                <li key={t.id_tutor} className="tarjeta item">
                  <div className="apilado">
                    <Link to={`/tutores/${t.id_tutor}`} className="item-titulo">
                      {nombreCompleto(t)}
                    </Link>
                    <Estrellas valor={t.reputacion_promedio} total={t.total_tutorias} />
                  </div>
                  <div className="match" title="Afinidad según reputación, nivel y horarios">
                    <span className="match-barra">
                      <span style={{ width: `${Math.round(Number(t.puntaje_match) * 100)}%` }} />
                    </span>
                    <span className="match-num">{Math.round(Number(t.puntaje_match) * 100)}%</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
