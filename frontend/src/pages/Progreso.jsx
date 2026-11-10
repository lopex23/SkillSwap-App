import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import { Cargando, MensajeError, Vacio } from '../components/ui';

export default function Progreso() {
  const { data, error, cargando, recargar } = useCarga(() => api('/sesiones/progreso'), []);
  const max = Math.max(1, ...(data?.progreso.map((p) => p.sesiones_completadas) ?? []));
  const total = data?.progreso.reduce((s, p) => s + p.sesiones_completadas, 0) ?? 0;

  return (
    <div className="pagina pagina-estrecha">
      <header className="pagina-cabecera">
        <h1>Mi progreso</h1>
        <p className="texto-suave">Sesiones de tutoría completadas por materia.</p>
      </header>

      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Cargando />}

      {data && data.progreso.length === 0 && (
        <Vacio titulo="Aún no has completado sesiones">
          <Link to="/solicitudes/nueva">Pide tu primera tutoría</Link>
        </Vacio>
      )}

      {data && data.progreso.length > 0 && (
        <section className="tarjeta">
          <p className="resumen-num">{total}</p>
          <p className="texto-suave">sesion{total === 1 ? '' : 'es'} completada{total === 1 ? '' : 's'} en total</p>
          <ul className="barras">
            {data.progreso.map((p) => (
              <li key={p.id_materia}>
                <span className="barra-etiqueta">{p.nombre_materia}</span>
                <span className="barra">
                  <span style={{ width: `${(p.sesiones_completadas / max) * 100}%` }} />
                </span>
                <span className="barra-num">{p.sesiones_completadas}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
