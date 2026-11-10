import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  Check,
  CirclePlus,
  ClipboardList,
  Inbox,
  MapPin,
  MessageSquare,
  Star,
  Users,
  Video,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import {
  Avatar,
  BarraProgreso,
  Esqueleto,
  Estrellas,
  FechaTile,
  Insignia,
  MensajeError,
  TarjetaDato,
  Vacio,
} from '../components/ui';
import { formatoFechaLarga, nombreCompleto, rangoHoras, tiempoRelativo } from '../utils/formato';

async function cargarPanel(usuario) {
  const esEstudiante = usuario.roles.includes('estudiante');
  const esTutor = usuario.roles.includes('tutor');
  const id = usuario.id_usuario;
  const [sesiones, pendientes, progreso, tutores, disponibles, materias, horarios, perfil, opiniones] =
    await Promise.all([
      api('/sesiones/mias'),
      esEstudiante ? api('/solicitudes/mias?estado=pendiente') : null,
      esEstudiante ? api('/sesiones/progreso') : null,
      esEstudiante ? api('/tutores') : null,
      esTutor ? api('/solicitudes/disponibles') : null,
      esTutor ? api('/tutores/me/materias') : null,
      esTutor ? api('/tutores/me/disponibilidad') : null,
      esTutor ? api(`/tutores/${id}`) : null,
      esTutor ? api(`/tutores/${id}/calificaciones`) : null,
    ]);

  const todas = sesiones.sesiones;
  const proximas = todas
    .filter((s) => s.estado === 'programada')
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

  return {
    proximas,
    completadasComoEstudiante: todas.filter((s) => s.estado === 'completada' && s.estudiante.id_estudiante === id).length,
    pendientes: pendientes?.solicitudes.length ?? 0,
    materiasEstudiadas: progreso?.progreso.length ?? 0,
    destacados: (tutores?.tutores ?? []).filter((t) => t.id_tutor !== id).slice(0, 3),
    disponibles: disponibles?.solicitudes.length ?? 0,
    materias: materias?.materias.length ?? 0,
    horarios: horarios?.disponibilidad.length ?? 0,
    tutor: perfil?.tutor ?? null,
    ultimaOpinion: opiniones?.calificaciones.find((c) => c.comentario) ?? null,
  };
}

function ProximaSesion({ s, idUsuario }) {
  const soyTutor = s.tutor.id_tutor === idUsuario;
  const otro = soyTutor ? s.estudiante : s.tutor;
  const Modalidad = s.modalidad === 'virtual' ? Video : MapPin;
  return (
    <li className="tarjeta sesion-item">
      <FechaTile iso={s.fecha_inicio} />
      <div className="sesion-cuerpo">
        <div className="fila-entre">
          <div className="apilado">
            <span className="titulo-item">{s.materia.nombre_materia}</span>
            <span className="meta">
              <span>
                <CalendarClock size={14} /> {rangoHoras(s.fecha_inicio, s.fecha_fin)}
              </span>
              <span>
                <Modalidad size={14} /> {s.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
              </span>
            </span>
          </div>
          <Insignia tono="info">{tiempoRelativo(s.fecha_inicio)}</Insignia>
        </div>
        <div className="fila">
          <Avatar persona={otro} id={soyTutor ? s.estudiante.id_estudiante : s.tutor.id_tutor} tamano="sm" />
          <span className="texto-suave">
            {soyTutor ? 'Estudiante' : 'Tutor'}: <strong style={{ color: 'var(--texto)' }}>{nombreCompleto(otro)}</strong>
          </span>
        </div>
      </div>
    </li>
  );
}

function ChecklistTutor({ data }) {
  const items = [
    { hecho: data.materias > 0, texto: 'Agrega al menos una materia', to: '/perfil-tutor' },
    { hecho: data.horarios > 0, texto: 'Registra tus horarios disponibles', to: '/perfil-tutor' },
    { hecho: (data.tutor?.total_tutorias ?? 0) > 0, texto: 'Completa tu primera tutoría', to: '/disponibles' },
    { hecho: data.tutor?.reputacion_promedio != null, texto: 'Recibe tu primera calificación', to: '/sesiones' },
  ];
  const hechos = items.filter((i) => i.hecho).length;
  return (
    <section className="tarjeta">
      <div className="tarjeta-cabecera">
        <h2>
          <Award size={18} /> Tu perfil de tutor
        </h2>
        <span className="texto-suave">
          {hechos}/{items.length}
        </span>
      </div>
      <BarraProgreso valor={hechos} max={items.length} degradado etiqueta="Perfil completado" />
      <ul className="checklist" style={{ marginTop: '1rem' }}>
        {items.map((i) => (
          <li key={i.texto} className={i.hecho ? 'hecho' : ''}>
            <span className="check" aria-hidden="true">
              <Check size={13} strokeWidth={3} />
            </span>
            {i.hecho ? <span>{i.texto}</span> : <Link to={i.to}>{i.texto}</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Panel() {
  const { usuario, tieneRol } = useAuth();
  const { data, error, cargando, recargar } = useCarga(() => cargarPanel(usuario), [usuario.id_usuario]);
  const esTutor = tieneRol('tutor');
  const esEstudiante = tieneRol('estudiante');

  let mensaje = 'Bienvenido a SkillSwap.';
  if (data) {
    const prox = data.proximas[0];
    if (prox) mensaje = `Tu próxima sesión de ${prox.materia.nombre_materia} es ${tiempoRelativo(prox.fecha_inicio)}.`;
    else if (esTutor && data.disponibles > 0)
      mensaje = `Hay ${data.disponibles} solicitud${data.disponibles === 1 ? '' : 'es'} esperando en tus materias.`;
    else if (esTutor) mensaje = 'Mantén tu perfil al día para recibir más solicitudes.';
    else mensaje = '¿En qué materia necesitas ayuda hoy?';
  }

  return (
    <div className="pagina">
      <section className="bienvenida">
        <div>
          <p className="bienvenida-fecha">{formatoFechaLarga()}</p>
          <h1>Hola, {usuario.nombre} 👋</h1>
          <p className="bienvenida-texto">{mensaje}</p>
        </div>
        <div className="acciones">
          {esEstudiante && (
            <Link to="/solicitudes/nueva" className="btn btn-claro">
              <CirclePlus size={18} /> Pedir tutoría
            </Link>
          )}
          {esTutor && (
            <Link to="/disponibles" className={esEstudiante ? 'btn btn-transparente' : 'btn btn-claro'}>
              <Inbox size={18} /> Ver solicitudes
            </Link>
          )}
          <Link to="/sesiones" className="btn btn-transparente">
            <CalendarCheck size={18} /> Mis sesiones
          </Link>
        </div>
      </section>

      <MensajeError error={error} onReintentar={recargar} />
      {cargando && !data && <Esqueleto filas={3} />}

      {data && (
        <>
          <div className="grid-datos">
            <TarjetaDato icono={CalendarClock} valor={data.proximas.length} etiqueta="Sesiones programadas" tono="info" />
            {esEstudiante && (
              <>
                <TarjetaDato icono={ClipboardList} valor={data.pendientes} etiqueta="Solicitudes esperando tutor" tono="aviso" />
                <TarjetaDato icono={CalendarCheck} valor={data.completadasComoEstudiante} etiqueta="Tutorías recibidas" tono="exito" />
                <TarjetaDato icono={BookOpen} valor={data.materiasEstudiadas} etiqueta="Materias reforzadas" tono="acento" />
              </>
            )}
            {esTutor && (
              <>
                <TarjetaDato icono={Inbox} valor={data.disponibles} etiqueta="Solicitudes en tus materias" tono="aviso" />
                <TarjetaDato icono={CalendarCheck} valor={data.tutor?.total_tutorias ?? 0} etiqueta="Tutorías dadas" tono="exito" />
                <TarjetaDato
                  icono={Star}
                  valor={data.tutor?.reputacion_promedio != null ? Number(data.tutor.reputacion_promedio).toFixed(1) : '—'}
                  etiqueta="Reputación"
                  tono="acento"
                  detalle={data.tutor?.reputacion_promedio == null ? 'Aún sin calificaciones' : 'de 5 estrellas'}
                />
              </>
            )}
          </div>

          <div className="grid-principal">
            <section className="seccion">
              <div className="seccion-cabecera">
                <h2>Próximas sesiones</h2>
                <Link to="/sesiones">
                  Ver todas <ArrowRight size={15} />
                </Link>
              </div>
              {data.proximas.length === 0 ? (
                <Vacio
                  icono={CalendarClock}
                  titulo="No tienes sesiones programadas"
                  accion={
                    esEstudiante ? (
                      <Link to="/solicitudes/nueva" className="btn btn-primario btn-sm">
                        <CirclePlus size={16} /> Pedir tutoría
                      </Link>
                    ) : (
                      <Link to="/disponibles" className="btn btn-primario btn-sm">
                        <Inbox size={16} /> Ver solicitudes
                      </Link>
                    )
                  }
                >
                  {esEstudiante ? 'Cuando un tutor acepte tu solicitud, la sesión aparecerá aquí.' : 'Acepta una solicitud para programar una sesión.'}
                </Vacio>
              ) : (
                <ul className="lista">
                  {data.proximas.slice(0, 4).map((s) => (
                    <ProximaSesion key={s.id_sesion} s={s} idUsuario={usuario.id_usuario} />
                  ))}
                </ul>
              )}
            </section>

            <div className="seccion">
              {esTutor && <ChecklistTutor data={data} />}

              {esTutor && data.ultimaOpinion && (
                <section className="tarjeta">
                  <div className="tarjeta-cabecera">
                    <h2>
                      <MessageSquare size={18} /> Última opinión
                    </h2>
                    <Estrellas valor={data.ultimaOpinion.puntuacion} compacto />
                  </div>
                  <p className="descripcion">“{data.ultimaOpinion.comentario}”</p>
                  <p className="texto-suave" style={{ marginTop: '0.5rem' }}>
                    {data.ultimaOpinion.materia.nombre_materia}
                  </p>
                </section>
              )}

              {esEstudiante && (
                <section className="tarjeta">
                  <div className="tarjeta-cabecera">
                    <h2>
                      <Users size={18} /> Tutores destacados
                    </h2>
                    <Link to="/tutores" className="texto-suave">
                      Ver todos
                    </Link>
                  </div>
                  {data.destacados.length === 0 ? (
                    <p className="texto-suave">Todavía no hay tutores registrados.</p>
                  ) : (
                    <ul className="lista-simple lista-compacta">
                      {data.destacados.map((t) => (
                        <li key={t.id_tutor}>
                          <span className="fila">
                            <Avatar persona={t} id={t.id_tutor} />
                            <span className="apilado">
                              <Link to={`/tutores/${t.id_tutor}`} className="titulo-item">
                                {nombreCompleto(t)}
                              </Link>
                              <span className="texto-suave" style={{ fontSize: '0.8rem' }}>
                                {t.materias.slice(0, 2).map((m) => m.nombre_materia).join(' · ') || 'Sin materias'}
                              </span>
                            </span>
                          </span>
                          <Estrellas valor={t.reputacion_promedio} compacto />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
