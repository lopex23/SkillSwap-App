import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, CirclePlus, MessageSquare, Star } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import {
  Avatar,
  BarraProgreso,
  Esqueleto,
  Estrellas,
  IconoArea,
  Insignia,
  MensajeError,
  Nivel,
  Vacio,
} from '../components/ui';
import Semana from '../components/Semana';
import { insigniasTutor } from './Tutores';
import { formatoFecha, nombreCompleto } from '../utils/formato';

function ResumenOpiniones({ calificaciones, promedio }) {
  const total = calificaciones.length;
  const conteo = [5, 4, 3, 2, 1].map((n) => ({ n, c: calificaciones.filter((x) => x.puntuacion === n).length }));
  return (
    <div className="resumen-opiniones">
      <div className="apilado" style={{ alignItems: 'center' }}>
        <span className="resumen-opiniones-num">{Number(promedio).toFixed(1)}</span>
        <Estrellas valor={promedio} sinNumero />
        <span className="texto-suave">
          {total} opinión{total === 1 ? '' : 'es'}
        </span>
      </div>
      <div className="distribucion">
        {conteo.map(({ n, c }) => (
          <div key={n} className="distribucion-fila">
            <span>
              {n} <Star size={11} fill="currentColor" style={{ color: 'var(--estrella)' }} />
            </span>
            <BarraProgreso valor={c} max={Math.max(1, total)} etiqueta={`${c} con ${n} estrellas`} />
            <span>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TutorDetalle() {
  const { id } = useParams();
  const { usuario, tieneRol } = useAuth();
  const { data, error, cargando, recargar } = useCarga(async () => {
    const [perfil, cal] = await Promise.all([api(`/tutores/${id}`), api(`/tutores/${id}/calificaciones`)]);
    return { tutor: perfil.tutor, calificaciones: cal.calificaciones };
  }, [id]);

  if (cargando) return <Esqueleto filas={3} alto={160} />;
  if (error) {
    return error.status === 404 ? (
      <Vacio titulo="Tutor no encontrado" accion={<Link to="/tutores">Ver todos los tutores</Link>} />
    ) : (
      <MensajeError error={error} onReintentar={recargar} />
    );
  }

  const { tutor: t, calificaciones } = data;
  const esYo = t.id_tutor === usuario.id_usuario;
  const puedePedir = !esYo && tieneRol('estudiante') && t.materias.length > 0;

  return (
    <div className="pagina pagina-estrecha">
      <Link to="/tutores" className="volver">
        <ArrowLeft size={16} /> Tutores
      </Link>

      <article className="tarjeta perfil-portada">
        <div className="perfil-banda" />
        <div className="perfil-cuerpo">
          <Avatar persona={t} id={t.id_tutor} tamano="xl" />
          <div className="perfil-datos">
            <div className="fila" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <h1>{nombreCompleto(t)}</h1>
              {insigniasTutor(t).map((i) => (
                <Insignia key={i.texto} tono={i.tono} icono={i.icono}>
                  {i.texto}
                </Insignia>
              ))}
              {esYo && <Insignia tono="primario">Tú</Insignia>}
            </div>
            <p className="texto-suave">
              {t.carrera || 'Carrera no indicada'}
              {t.semestre ? ` · Semestre ${t.semestre}` : ''}
            </p>
          </div>
          {puedePedir && (
            <Link
              to={`/solicitudes/nueva${t.materias.length === 1 ? `?materia=${t.materias[0].id_materia}` : ''}`}
              className="btn btn-primario"
            >
              <CirclePlus size={17} /> Pedir tutoría
            </Link>
          )}
          {esYo && (
            <Link to="/perfil-tutor" className="btn btn-secundario">
              Editar mi perfil
            </Link>
          )}
        </div>
        <div className="perfil-cifras">
          <div>
            <strong>{t.reputacion_promedio != null ? Number(t.reputacion_promedio).toFixed(1) : '—'}</strong>
            <span>Reputación</span>
          </div>
          <div>
            <strong>{t.total_tutorias ?? 0}</strong>
            <span>Tutorías</span>
          </div>
          <div>
            <strong>{t.materias.length}</strong>
            <span>Materias</span>
          </div>
          <div>
            <strong>{calificaciones.length}</strong>
            <span>Opiniones</span>
          </div>
        </div>
      </article>

      <section className="tarjeta">
        <div className="tarjeta-cabecera">
          <h2>
            <BookOpen size={18} /> Materias que enseña
          </h2>
        </div>
        {t.materias.length === 0 ? (
          <p className="texto-suave">Sin materias registradas.</p>
        ) : (
          <ul className="lista-simple">
            {t.materias.map((m) => (
              <li key={m.id_materia}>
                <span className="fila">
                  <IconoArea codigo={m.codigo_materia} />
                  <span className="apilado">
                    <span className="titulo-item">{m.nombre_materia}</span>
                    <span className="codigo">{m.codigo_materia}</span>
                  </span>
                </span>
                <Nivel nivel={m.nivel} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tarjeta">
        <div className="tarjeta-cabecera">
          <h2>
            <CalendarDays size={18} /> Disponibilidad semanal
          </h2>
        </div>
        {t.disponibilidad.length === 0 ? (
          <p className="texto-suave">Este tutor aún no registró horarios. Igual puede aceptar tu solicitud y proponerte uno.</p>
        ) : (
          <Semana disponibilidad={t.disponibilidad} />
        )}
      </section>

      <section className="tarjeta">
        <div className="tarjeta-cabecera">
          <h2>
            <MessageSquare size={18} /> Opiniones
          </h2>
        </div>
        {calificaciones.length === 0 ? (
          <Vacio icono={MessageSquare} titulo="Aún no tiene calificaciones">
            Las opiniones aparecen cuando un estudiante califica una sesión completada.
          </Vacio>
        ) : (
          <>
            <ResumenOpiniones calificaciones={calificaciones} promedio={t.reputacion_promedio} />
            <div className="separador" style={{ margin: '1.25rem 0' }} />
            <ul className="lista">
              {calificaciones.map((c, i) => (
                <li key={i} className="calificacion">
                  <div className="fila-entre">
                    <Estrellas valor={c.puntuacion} />
                    <span className="texto-suave" style={{ fontSize: '0.82rem' }}>
                      {c.materia.nombre_materia} · {formatoFecha(c.fecha)}
                    </span>
                  </div>
                  {c.comentario ? (
                    <p className="descripcion">“{c.comentario}”</p>
                  ) : (
                    <p className="texto-suave">Sin comentario.</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
