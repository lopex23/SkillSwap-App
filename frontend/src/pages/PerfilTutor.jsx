import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, Eye, Plus, Trash2, UserCog } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import { useUI } from '../context/UIContext';
import {
  Alerta,
  Avatar,
  BarraProgreso,
  Campo,
  Chip,
  Esqueleto,
  Estrellas,
  IconoArea,
  MensajeError,
  Nivel,
  Vacio,
} from '../components/ui';
import Semana, { DIAS } from '../components/Semana';
import { agruparPorArea } from '../utils/areas';
import { capitalizar, nombreCompleto } from '../utils/formato';

const NIVELES = ['básico', 'intermedio', 'avanzado'];

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
  const { toast, confirmar } = useUI();
  const { data, error, cargando, recargar } = useCarga(() => cargar(usuario.id_usuario), [usuario.id_usuario]);
  const [nueva, setNueva] = useState({ id_materia: '', nivel: 'intermedio' });
  const [franja, setFranja] = useState({ dia_semana: 'lunes', hora_inicio: '14:00', hora_fin: '16:00' });
  const [errorFranja, setErrorFranja] = useState(null);
  const areas = useMemo(() => agruparPorArea(data?.catalogo ?? []), [data]);

  if (cargando && !data) return <Esqueleto filas={3} alto={160} />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  const idsMias = new Set(data.mias.map((m) => m.id_materia));
  const pasos = [data.mias.length > 0, data.disponibilidad.length > 0];
  const completado = pasos.filter(Boolean).length;

  const guardarMateria = async (e) => {
    e.preventDefault();
    const existia = idsMias.has(Number(nueva.id_materia));
    try {
      await api('/tutores/me/materias', {
        method: 'POST',
        body: { id_materia: Number(nueva.id_materia), nivel: nueva.nivel },
      });
      toast.exito(existia ? 'Nivel actualizado.' : 'Materia agregada. Ya verás las solicitudes de esta materia.');
      setNueva({ id_materia: '', nivel: 'intermedio' });
      recargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const quitarMateria = async (m) => {
    const ok = await confirmar({
      titulo: `¿Quitar ${m.nombre_materia}?`,
      mensaje: 'Dejarás de ver las solicitudes de esta materia. Puedes volver a agregarla cuando quieras.',
      confirmar: 'Quitar materia',
      peligro: true,
    });
    if (!ok) return;
    try {
      await api(`/tutores/me/materias/${m.id_materia}`, { method: 'DELETE' });
      toast.info('Materia quitada.');
      recargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const agregarFranja = async (e) => {
    e.preventDefault();
    setErrorFranja(null);
    try {
      await api('/tutores/me/disponibilidad', { method: 'POST', body: franja });
      toast.exito(`Horario agregado: ${capitalizar(franja.dia_semana)} ${franja.hora_inicio}–${franja.hora_fin}.`);
      recargar();
    } catch (err) {
      setErrorFranja(err);
    }
  };

  const quitarFranja = async (f) => {
    try {
      await api(`/tutores/me/disponibilidad/${f.id_disponibilidad}`, { method: 'DELETE' });
      toast.info('Horario quitado.');
      recargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const erroresFranja = errorFranja?.errores || {};

  return (
    <div className="pagina">
      <header className="tarjeta fila-entre" style={{ alignItems: 'center' }}>
        <div className="fila">
          <Avatar persona={usuario} id={usuario.id_usuario} tamano="lg" />
          <div className="apilado">
            <h1>{nombreCompleto(usuario)}</h1>
            <Estrellas valor={data.tutor.reputacion_promedio} total={data.tutor.total_tutorias ?? 0} />
          </div>
        </div>
        <div className="apilado" style={{ minWidth: 220, gap: '0.4rem' }}>
          <span className="texto-suave">
            Perfil completado: <strong style={{ color: 'var(--texto)' }}>{Math.round((completado / pasos.length) * 100)}%</strong>
          </span>
          <BarraProgreso valor={completado} max={pasos.length} degradado etiqueta="Perfil completado" />
          <Link to={`/tutores/${usuario.id_usuario}`} className="btn-enlace" style={{ paddingLeft: 0 }}>
            <Eye size={15} /> Ver mi perfil público
          </Link>
        </div>
      </header>

      {completado < pasos.length && (
        <Alerta tipo="aviso" icono={UserCog}>
          {data.mias.length === 0
            ? 'Agrega al menos una materia para empezar a recibir solicitudes.'
            : 'Registra tus horarios: los tutores con disponibilidad aparecen más arriba en las sugerencias.'}
        </Alerta>
      )}

      <section className="tarjeta">
        <div className="tarjeta-cabecera">
          <h2>
            <BookOpen size={18} /> Materias que enseño
          </h2>
          <span className="texto-suave">{data.mias.length}</span>
        </div>

        {data.mias.length === 0 ? (
          <Vacio icono={BookOpen} titulo="Aún no has agregado materias">
            Elige abajo una materia y tu nivel.
          </Vacio>
        ) : (
          <ul className="lista-simple">
            {data.mias.map((m) => (
              <li key={m.id_materia}>
                <span className="fila">
                  <IconoArea codigo={m.codigo_materia} />
                  <span className="apilado">
                    <span className="titulo-item">{m.nombre_materia}</span>
                    <span className="codigo">{m.codigo_materia}</span>
                  </span>
                </span>
                <span className="fila">
                  <Nivel nivel={m.nivel} />
                  <button type="button" className="icono-btn" aria-label={`Quitar ${m.nombre_materia}`} onClick={() => quitarMateria(m)}>
                    <Trash2 size={17} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <form className="panel-accion" style={{ marginTop: '1rem' }} onSubmit={guardarMateria}>
          <span className="campo-label">Agregar materia o cambiar nivel</span>
          <div className="form-linea">
            <Campo label="Materia">
              <select value={nueva.id_materia} onChange={(e) => setNueva({ ...nueva, id_materia: e.target.value })}>
                <option value="">Selecciona…</option>
                {areas.map((a) => (
                  <optgroup key={a.clave} label={a.nombre}>
                    {a.materias.map((m) => (
                      <option key={m.id_materia} value={m.id_materia}>
                        {m.nombre_materia}
                        {idsMias.has(m.id_materia) ? ' (ya la enseñas)' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Campo>
            <div className="campo">
              <span className="campo-label">Nivel</span>
              <div className="chips" role="radiogroup" aria-label="Nivel">
                {NIVELES.map((n) => (
                  <Chip key={n} activo={nueva.nivel === n} onClick={() => setNueva({ ...nueva, nivel: n })}>
                    {capitalizar(n)}
                  </Chip>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primario" disabled={!nueva.id_materia}>
              <Plus size={17} /> Guardar
            </button>
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <div className="tarjeta-cabecera">
          <h2>
            <CalendarDays size={18} /> Mis horarios disponibles
          </h2>
          <span className="texto-suave">Pasa el cursor sobre una franja para quitarla</span>
        </div>

        <Semana disponibilidad={data.disponibilidad} onQuitar={quitarFranja} />

        <form className="panel-accion" style={{ marginTop: '1rem' }} onSubmit={agregarFranja}>
          <span className="campo-label">Agregar horario</span>
          <MensajeError error={errorFranja && !Object.keys(erroresFranja).length ? errorFranja : null} />
          <div className="form-linea">
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
              <input type="time" value={franja.hora_inicio} onChange={(e) => setFranja({ ...franja, hora_inicio: e.target.value })} />
            </Campo>
            <Campo label="Hasta" error={erroresFranja.hora_fin}>
              <input type="time" value={franja.hora_fin} onChange={(e) => setFranja({ ...franja, hora_fin: e.target.value })} />
            </Campo>
            <button type="submit" className="btn btn-primario">
              <Plus size={17} /> Agregar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
