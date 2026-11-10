import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import { Cargando, Chip, Estrellas, MensajeError, Vacio } from '../components/ui';
import { capitalizar, formatoFecha, nombreCompleto } from '../utils/formato';

export default function TutorDetalle() {
  const { id } = useParams();
  const { data, error, cargando, recargar } = useCarga(async () => {
    const [perfil, cal] = await Promise.all([api(`/tutores/${id}`), api(`/tutores/${id}/calificaciones`)]);
    return { tutor: perfil.tutor, calificaciones: cal.calificaciones };
  }, [id]);

  if (cargando) return <Cargando />;
  if (error) {
    return error.status === 404 ? (
      <Vacio titulo="Tutor no encontrado">
        <Link to="/tutores">Ver todos los tutores</Link>
      </Vacio>
    ) : (
      <MensajeError error={error} onReintentar={recargar} />
    );
  }

  const { tutor: t, calificaciones } = data;

  return (
    <div className="pagina pagina-estrecha">
      <Link to="/tutores" className="volver">
        ← Tutores
      </Link>

      <article className="tarjeta perfil">
        <span className="avatar avatar-lg" aria-hidden="true">
          {t.nombre.charAt(0)}
          {t.apellido.charAt(0)}
        </span>
        <div>
          <h1 className="titulo-tarjeta">{nombreCompleto(t)}</h1>
          <p className="texto-suave">
            {t.carrera || 'Carrera no indicada'}
            {t.semestre ? ` · semestre ${t.semestre}` : ''}
          </p>
          <Estrellas valor={t.reputacion_promedio} total={t.total_tutorias ?? 0} />
        </div>
      </article>

      <div className="grid-2">
        <section className="tarjeta">
          <h2>Materias</h2>
          {t.materias.length === 0 ? (
            <p className="texto-suave">Sin materias registradas.</p>
          ) : (
            <ul className="lista-simple">
              {t.materias.map((m) => (
                <li key={m.id_materia}>
                  <span>{m.nombre_materia}</span>
                  <Chip>{m.nivel}</Chip>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tarjeta">
          <h2>Horarios</h2>
          {t.disponibilidad.length === 0 ? (
            <p className="texto-suave">Sin horarios registrados.</p>
          ) : (
            <ul className="lista-simple">
              {t.disponibilidad.map((d) => (
                <li key={d.id_disponibilidad}>
                  <strong>{capitalizar(d.dia_semana)}</strong>
                  <span>
                    {d.hora_inicio} – {d.hora_fin}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="seccion">
        <h2>Opiniones ({calificaciones.length})</h2>
        {calificaciones.length === 0 ? (
          <Vacio titulo="Este tutor aún no tiene calificaciones" />
        ) : (
          <ul className="lista">
            {calificaciones.map((c, i) => (
              <li key={i} className="tarjeta item item-columna">
                <div className="item-fila">
                  <Estrellas valor={c.puntuacion} />
                  <span className="texto-suave">
                    {c.materia.nombre_materia} · {formatoFecha(c.fecha)}
                  </span>
                </div>
                {c.comentario && <p className="item-descripcion">“{c.comentario}”</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
