import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import { Campo, Cargando, Chip, Estrellas, MensajeError, Vacio } from '../components/ui';
import { capitalizar } from '../utils/formato';

const NIVELES = ['básico', 'intermedio', 'avanzado'];
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

async function cargar(idUsuario) {
  const [materias, mias, disponibilidad, perfil] = await Promise.all([
    api('/materias'),
    api('/tutores/me/materias'),
    api('/tutores/me/disponibilidad'),
    api(`/tutores/${idUsuario}`),
  ]);
  return {
    catalogo: materias.materias,
    mias: mias.materias,
    disponibilidad: disponibilidad.disponibilidad,
    tutor: perfil.tutor,
  };
}

export default function PerfilTutor() {
  const { usuario } = useAuth();
  const { data, error, cargando, recargar } = useCarga(() => cargar(usuario.id_usuario), [usuario.id_usuario]);
  const [nuevaMateria, setNuevaMateria] = useState({ id_materia: '', nivel: 'intermedio' });
  const [franja, setFranja] = useState({ dia_semana: 'lunes', hora_inicio: '14:00', hora_fin: '16:00' });
  const [errorMateria, setErrorMateria] = useState(null);
  const [errorFranja, setErrorFranja] = useState(null);

  if (cargando && !data) return <Cargando />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  const idsMias = new Set(data.mias.map((m) => m.id_materia));

  const agregarMateria = async (e) => {
    e.preventDefault();
    setErrorMateria(null);
    try {
      await api('/tutores/me/materias', {
        method: 'POST',
        body: { id_materia: Number(nuevaMateria.id_materia), nivel: nuevaMateria.nivel },
      });
      setNuevaMateria({ id_materia: '', nivel: 'intermedio' });
      recargar();
    } catch (err) {
      setErrorMateria(err);
    }
  };

  const quitarMateria = async (id) => {
    setErrorMateria(null);
    try {
      await api(`/tutores/me/materias/${id}`, { method: 'DELETE' });
      recargar();
    } catch (err) {
      setErrorMateria(err);
    }
  };

  const agregarFranja = async (e) => {
    e.preventDefault();
    setErrorFranja(null);
    try {
      await api('/tutores/me/disponibilidad', { method: 'POST', body: franja });
      recargar();
    } catch (err) {
      setErrorFranja(err);
    }
  };

  const quitarFranja = async (id) => {
    setErrorFranja(null);
    try {
      await api(`/tutores/me/disponibilidad/${id}`, { method: 'DELETE' });
      recargar();
    } catch (err) {
      setErrorFranja(err);
    }
  };

  const erroresFranja = errorFranja?.errores || {};

  return (
    <div className="pagina">
      <header className="pagina-cabecera con-accion">
        <div>
          <h1>Mi perfil de tutor</h1>
          <Estrellas valor={data.tutor.reputacion_promedio} total={data.tutor.total_tutorias ?? 0} />
        </div>
        <Link to={`/tutores/${usuario.id_usuario}`} className="btn btn-secundario">
          Ver mi perfil público
        </Link>
      </header>

      {(data.mias.length === 0 || data.disponibilidad.length === 0) && (
        <div className="alerta alerta-aviso">
          Para recibir solicitudes agrega al menos una materia. Registrar tus horarios mejora tu posición en las
          sugerencias.
        </div>
      )}

      <div className="grid-2">
        <section className="tarjeta">
          <h2>Materias que enseño</h2>
          {data.mias.length === 0 ? (
            <Vacio titulo="Aún no has agregado materias" />
          ) : (
            <ul className="lista-simple">
              {data.mias.map((m) => (
                <li key={m.id_materia}>
                  <span>
                    {m.nombre_materia} <Chip>{m.nivel}</Chip>
                  </span>
                  <button type="button" className="btn-enlace peligro" onClick={() => quitarMateria(m.id_materia)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="form-linea" onSubmit={agregarMateria}>
            <Campo label="Materia">
              <select
                value={nuevaMateria.id_materia}
                onChange={(e) => setNuevaMateria({ ...nuevaMateria, id_materia: e.target.value })}
              >
                <option value="">Selecciona…</option>
                {data.catalogo.map((m) => (
                  <option key={m.id_materia} value={m.id_materia}>
                    {m.nombre_materia}
                    {idsMias.has(m.id_materia) ? ' (cambiar nivel)' : ''}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Nivel">
              <select
                value={nuevaMateria.nivel}
                onChange={(e) => setNuevaMateria({ ...nuevaMateria, nivel: e.target.value })}
              >
                {NIVELES.map((n) => (
                  <option key={n} value={n}>
                    {capitalizar(n)}
                  </option>
                ))}
              </select>
            </Campo>
            <button type="submit" className="btn btn-primario" disabled={!nuevaMateria.id_materia}>
              Guardar
            </button>
          </form>
          <MensajeError error={errorMateria} />
        </section>

        <section className="tarjeta">
          <h2>Mis horarios disponibles</h2>
          {data.disponibilidad.length === 0 ? (
            <Vacio titulo="Aún no has registrado horarios" />
          ) : (
            <ul className="lista-simple">
              {data.disponibilidad.map((d) => (
                <li key={d.id_disponibilidad}>
                  <span>
                    <strong>{capitalizar(d.dia_semana)}</strong> {d.hora_inicio} – {d.hora_fin}
                  </span>
                  <button type="button" className="btn-enlace peligro" onClick={() => quitarFranja(d.id_disponibilidad)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="form-linea" onSubmit={agregarFranja}>
            <Campo label="Día" error={erroresFranja.dia_semana}>
              <select value={franja.dia_semana} onChange={(e) => setFranja({ ...franja, dia_semana: e.target.value })}>
                {DIAS.map((d) => (
                  <option key={d} value={d}>
                    {capitalizar(d)}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Desde" error={erroresFranja.hora_inicio}>
              <input
                type="time"
                value={franja.hora_inicio}
                onChange={(e) => setFranja({ ...franja, hora_inicio: e.target.value })}
              />
            </Campo>
            <Campo label="Hasta" error={erroresFranja.hora_fin}>
              <input type="time" value={franja.hora_fin} onChange={(e) => setFranja({ ...franja, hora_fin: e.target.value })} />
            </Campo>
            <button type="submit" className="btn btn-primario">
              Agregar
            </button>
          </form>
          <MensajeError error={errorFranja && !Object.keys(erroresFranja).length ? errorFranja : null} />
        </section>
      </div>
    </div>
  );
}
