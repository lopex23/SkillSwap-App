import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import { Campo, Cargando, Chip, Estrellas, MensajeError, Vacio } from '../components/ui';
import { nombreCompleto } from '../utils/formato';

export default function Tutores() {
  const [params, setParams] = useSearchParams();
  const materia = params.get('materia') || '';
  const catalogo = useCarga(() => api('/materias'), []);
  const { data, error, cargando, recargar } = useCarga(
    () => api(`/tutores${materia ? `?materia=${materia}` : ''}`),
    [materia]
  );

  const cambiarMateria = (e) => setParams(e.target.value ? { materia: e.target.value } : {});

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Tutores</h1>
        <p className="texto-suave">Encuentra quién puede ayudarte, ordenados por reputación.</p>
      </header>

      <div className="filtros">
        <Campo label="Filtrar por materia">
          <select value={materia} onChange={cambiarMateria} disabled={!catalogo.data}>
            <option value="">Todas las materias</option>
            {catalogo.data?.materias.map((m) => (
              <option key={m.id_materia} value={m.id_materia}>
                {m.nombre_materia}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <MensajeError error={error || catalogo.error} onReintentar={recargar} />
      {cargando && <Cargando />}

      {data && data.tutores.length === 0 && (
        <Vacio titulo="No hay tutores para esta materia todavía">
          Igual puedes <Link to="/solicitudes/nueva">crear una solicitud</Link>: cuando un tutor agregue la materia,
          podrá verla.
        </Vacio>
      )}

      {data && data.tutores.length > 0 && (
        <ul className="grid-tarjetas">
          {data.tutores.map((t) => (
            <li key={t.id_tutor} className="tarjeta tutor-tarjeta">
              <div className="tutor-cabecera">
                <span className="avatar" aria-hidden="true">
                  {t.nombre.charAt(0)}
                  {t.apellido.charAt(0)}
                </span>
                <div>
                  <Link to={`/tutores/${t.id_tutor}`} className="item-titulo">
                    {nombreCompleto(t)}
                  </Link>
                  <p className="texto-suave">
                    {t.carrera || 'Carrera no indicada'}
                    {t.semestre ? ` · sem. ${t.semestre}` : ''}
                  </p>
                </div>
              </div>
              <Estrellas valor={t.reputacion_promedio} total={t.total_tutorias ?? 0} />
              <div className="chips">
                {t.materias.length === 0 ? (
                  <span className="texto-suave">Sin materias registradas</span>
                ) : (
                  t.materias.map((m) => <Chip key={m.id_materia}>{m.nombre_materia}</Chip>)
                )}
              </div>
              <Link to={`/tutores/${t.id_tutor}`} className="btn btn-sm btn-secundario">
                Ver perfil
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
