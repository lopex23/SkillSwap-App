import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import { Cargando, Estrellas, MensajeError, Vacio } from '../components/ui';
import { nombreCompleto, rangoSesion } from '../utils/formato';

async function cargarPanel(usuario) {
  const esEstudiante = usuario.roles.includes('estudiante');
  const esTutor = usuario.roles.includes('tutor');
  const [sesiones, solicitudes, disponibles, materias, horarios, perfil] = await Promise.all([
    api('/sesiones/mias?estado=programada'),
    esEstudiante ? api('/solicitudes/mias?estado=pendiente') : null,
    esTutor ? api('/solicitudes/disponibles') : null,
    esTutor ? api('/tutores/me/materias') : null,
    esTutor ? api('/tutores/me/disponibilidad') : null,
    esTutor ? api(`/tutores/${usuario.id_usuario}`) : null,
  ]);
  const proximas = [...sesiones.sesiones].sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
  return {
    proximas,
    pendientes: solicitudes?.solicitudes.length ?? 0,
    disponibles: disponibles?.solicitudes.length ?? 0,
    materias: materias?.materias.length ?? 0,
    horarios: horarios?.disponibilidad.length ?? 0,
    tutor: perfil?.tutor ?? null,
  };
}

export default function Panel() {
  const { usuario, tieneRol } = useAuth();
  const { data, error, cargando, recargar } = useCarga(() => cargarPanel(usuario), [usuario.id_usuario]);

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Hola, {usuario.nombre} 👋</h1>
        <p className="texto-suave">
          {usuario.carrera ? `${usuario.carrera}` : 'Bienvenido a SkillSwap'}
          {usuario.semestre ? ` · Semestre ${usuario.semestre}` : ''}
        </p>
      </header>

      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Cargando />}

      {data && (
        <>
          <div className="grid-tarjetas">
            {tieneRol('estudiante') && (
              <article className="tarjeta resumen">
                <h2>¿Necesitas ayuda?</h2>
                <p className="resumen-num">{data.pendientes}</p>
                <p className="texto-suave">solicitud{data.pendientes === 1 ? '' : 'es'} esperando tutor</p>
                <div className="acciones">
                  <Link to="/solicitudes/nueva" className="btn btn-primario">
                    Pedir tutoría
                  </Link>
                  <Link to="/solicitudes" className="btn btn-secundario">
                    Ver mis solicitudes
                  </Link>
                </div>
              </article>
            )}

            {tieneRol('tutor') && (
              <>
                <article className="tarjeta resumen">
                  <h2>Solicitudes para ti</h2>
                  <p className="resumen-num">{data.disponibles}</p>
                  <p className="texto-suave">pendientes en tus materias</p>
                  <div className="acciones">
                    <Link to="/disponibles" className="btn btn-primario">
                      Ver solicitudes
                    </Link>
                  </div>
                </article>
                <article className="tarjeta resumen">
                  <h2>Tu perfil de tutor</h2>
                  <Estrellas valor={data.tutor?.reputacion_promedio} total={data.tutor?.total_tutorias ?? 0} />
                  <p className="texto-suave">
                    {data.materias} materia{data.materias === 1 ? '' : 's'} · {data.horarios} horario
                    {data.horarios === 1 ? '' : 's'}
                  </p>
                  {(data.materias === 0 || data.horarios === 0) && (
                    <p className="aviso-texto">Completa tu perfil para recibir más solicitudes.</p>
                  )}
                  <div className="acciones">
                    <Link to="/perfil-tutor" className="btn btn-secundario">
                      Editar perfil
                    </Link>
                  </div>
                </article>
              </>
            )}
          </div>

          <section className="seccion">
            <div className="seccion-cabecera">
              <h2>Próximas sesiones</h2>
              <Link to="/sesiones">Ver todas</Link>
            </div>
            {data.proximas.length === 0 ? (
              <Vacio titulo="No tienes sesiones programadas">
                {tieneRol('estudiante') ? 'Pide una tutoría para empezar.' : 'Acepta una solicitud para programar una sesión.'}
              </Vacio>
            ) : (
              <ul className="lista">
                {data.proximas.slice(0, 3).map((s) => {
                  const soyTutor = s.tutor.id_tutor === usuario.id_usuario;
                  return (
                    <li key={s.id_sesion} className="tarjeta item">
                      <div>
                        <p className="item-titulo">{s.materia.nombre_materia}</p>
                        <p className="texto-suave">
                          {soyTutor ? `Con ${nombreCompleto(s.estudiante)} (estudiante)` : `Con ${nombreCompleto(s.tutor)} (tutor)`}
                          {' · '}
                          {s.modalidad}
                        </p>
                      </div>
                      <p className="item-fecha">{rangoSesion(s.fecha_inicio, s.fecha_fin)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
