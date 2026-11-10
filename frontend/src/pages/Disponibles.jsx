import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock, Inbox, Sparkles, UserCog } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import { useUI } from '../context/UIContext';
import AceptarSolicitud from '../components/AceptarSolicitud';
import { Avatar, EncabezadoPagina, Esqueleto, IconoArea, Insignia, MensajeError, Vacio } from '../components/ui';
import { nombreCompleto, tiempoRelativo } from '../utils/formato';

export default function Disponibles() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { toast } = useUI();
  const [abierta, setAbierta] = useState(null);
  const { data, error, cargando, recargar } = useCarga(() => api('/solicitudes/disponibles'), []);

  return (
    <div className="pagina">
      <EncabezadoPagina
        icono={Inbox}
        titulo="Solicitudes disponibles"
        descripcion="Estudiantes que necesitan ayuda en las materias que enseñas. Las más antiguas primero."
      />

      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Esqueleto filas={3} alto={150} />}

      {data && data.solicitudes.length === 0 && (
        <Vacio
          icono={Inbox}
          titulo="No hay solicitudes pendientes en tus materias"
          accion={
            <Link to="/perfil-tutor" className="btn btn-secundario btn-sm">
              <UserCog size={16} /> Revisar mis materias
            </Link>
          }
        >
          Te avisaremos aquí cuando un estudiante pida ayuda en alguna de tus materias. Agregar más materias aumenta tus
          oportunidades.
        </Vacio>
      )}

      {data && data.solicitudes.length > 0 && (
        <ul className="lista">
          {data.solicitudes.map((s) => {
            const sugerido = s.tutores_sugeridos.find((t) => t.id_tutor === usuario.id_usuario);
            return (
              <li key={s.id_solicitud} className="tarjeta" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div className="fila-entre">
                  <div className="fila">
                    <IconoArea codigo={s.materia.codigo_materia} />
                    <div className="apilado">
                      <Link to={`/solicitudes/${s.id_solicitud}`} className="titulo-item">
                        {s.materia.nombre_materia}
                      </Link>
                      <span className="meta">
                        <span>
                          <Clock size={13} /> {tiempoRelativo(s.fecha_solicitud)}
                        </span>
                      </span>
                    </div>
                  </div>
                  {sugerido && (
                    <Insignia tono="exito" icono={Sparkles}>
                      Eres sugerido · {Math.round(Number(sugerido.puntaje_match) * 100)}%
                    </Insignia>
                  )}
                </div>

                <p className="descripcion">{s.descripcion}</p>

                <div className="fila">
                  <Avatar persona={s.estudiante} id={s.estudiante.id_estudiante} tamano="sm" />
                  <span className="texto-suave">
                    <strong style={{ color: 'var(--texto)' }}>{nombreCompleto(s.estudiante)}</strong>
                    {s.estudiante.carrera ? ` · ${s.estudiante.carrera}` : ''}
                    {s.estudiante.semestre ? ` · semestre ${s.estudiante.semestre}` : ''}
                  </span>
                </div>

                {abierta === s.id_solicitud ? (
                  <AceptarSolicitud
                    idSolicitud={s.id_solicitud}
                    onAceptada={() => {
                      toast.exito(`¡Sesión programada con ${s.estudiante.nombre}!`);
                      navigate('/sesiones');
                    }}
                    onCancelar={() => setAbierta(null)}
                  />
                ) : (
                  <div className="acciones">
                    <button type="button" className="btn btn-primario btn-sm" onClick={() => setAbierta(s.id_solicitud)}>
                      <CalendarCheck size={16} /> Aceptar y programar
                    </button>
                    <Link to={`/solicitudes/${s.id_solicitud}`} className="btn btn-fantasma btn-sm">
                      Ver detalle
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
