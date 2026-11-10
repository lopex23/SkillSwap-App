import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import { Campo, Cargando, MensajeError, Vacio } from '../components/ui';
import { normalizar } from '../utils/formato';

function FilaMateria({ m, onCambio, onError }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ codigo_materia: m.codigo_materia, nombre_materia: m.nombre_materia });

  const guardar = async (e) => {
    e.preventDefault();
    onError(null);
    try {
      await api(`/materias/${m.id_materia}`, { method: 'PUT', body: form });
      setEditando(false);
      onCambio();
    } catch (err) {
      onError(err);
    }
  };

  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar "${m.nombre_materia}"?`)) return;
    onError(null);
    try {
      await api(`/materias/${m.id_materia}`, { method: 'DELETE' });
      onCambio();
    } catch (err) {
      onError(err);
    }
  };

  if (editando) {
    return (
      <li>
        <form className="form-linea" onSubmit={guardar}>
          <input
            aria-label="Código"
            value={form.codigo_materia}
            onChange={(e) => setForm({ ...form, codigo_materia: e.target.value })}
          />
          <input
            aria-label="Nombre"
            value={form.nombre_materia}
            onChange={(e) => setForm({ ...form, nombre_materia: e.target.value })}
          />
          <button type="submit" className="btn btn-primario btn-sm">
            Guardar
          </button>
          <button type="button" className="btn btn-secundario btn-sm" onClick={() => setEditando(false)}>
            Cancelar
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <span>
        <span className="codigo">{m.codigo_materia}</span> {m.nombre_materia}
      </span>
      <span className="acciones">
        <button type="button" className="btn-enlace" onClick={() => setEditando(true)}>
          Editar
        </button>
        <button type="button" className="btn-enlace peligro" onClick={eliminar}>
          Eliminar
        </button>
      </span>
    </li>
  );
}

export default function AdminMaterias() {
  const { data, error, cargando, recargar } = useCarga(() => api('/materias'), []);
  const [filtro, setFiltro] = useState('');
  const [nueva, setNueva] = useState({ codigo_materia: '', nombre_materia: '' });
  const [errorAccion, setErrorAccion] = useState(null);

  const materias = useMemo(() => {
    const f = normalizar(filtro);
    const lista = data?.materias ?? [];
    return f ? lista.filter((m) => normalizar(`${m.codigo_materia} ${m.nombre_materia}`).includes(f)) : lista;
  }, [data, filtro]);

  const crear = async (e) => {
    e.preventDefault();
    setErrorAccion(null);
    try {
      await api('/materias', { method: 'POST', body: nueva });
      setNueva({ codigo_materia: '', nombre_materia: '' });
      recargar();
    } catch (err) {
      setErrorAccion(err);
    }
  };

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Materias</h1>
        <p className="texto-suave">Administra el catálogo de materias disponibles para tutorías.</p>
      </header>

      <form className="tarjeta form-linea" onSubmit={crear}>
        <Campo label="Código" error={errorAccion?.errores?.codigo_materia}>
          <input
            placeholder="Ej. QUI-101"
            value={nueva.codigo_materia}
            onChange={(e) => setNueva({ ...nueva, codigo_materia: e.target.value })}
          />
        </Campo>
        <Campo label="Nombre" error={errorAccion?.errores?.nombre_materia}>
          <input
            placeholder="Ej. Química General"
            value={nueva.nombre_materia}
            onChange={(e) => setNueva({ ...nueva, nombre_materia: e.target.value })}
          />
        </Campo>
        <button type="submit" className="btn btn-primario">
          Agregar materia
        </button>
      </form>

      <MensajeError error={errorAccion && !Object.keys(errorAccion.errores || {}).length ? errorAccion : null} />
      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Cargando />}

      {data && (
        <section className="tarjeta">
          <Campo label={`Buscar (${materias.length} de ${data.materias.length})`}>
            <input type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          </Campo>
          {materias.length === 0 ? (
            <Vacio titulo="Sin resultados" />
          ) : (
            <ul className="lista-simple">
              {materias.map((m) => (
                <FilaMateria key={m.id_materia} m={m} onCambio={recargar} onError={setErrorAccion} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
