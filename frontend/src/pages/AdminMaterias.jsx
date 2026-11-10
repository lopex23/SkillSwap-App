import { useMemo, useState } from 'react';
import { BookOpen, Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import { useUI } from '../context/UIContext';
import { Campo, Chip, EncabezadoPagina, Esqueleto, IconoArea, MensajeError, Vacio } from '../components/ui';
import { agruparPorArea, areaDe, prefijo } from '../utils/areas';
import { normalizar } from '../utils/formato';

function FilaMateria({ m, onCambio }) {
  const { toast, confirmar } = useUI();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ codigo_materia: m.codigo_materia, nombre_materia: m.nombre_materia });

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await api(`/materias/${m.id_materia}`, { method: 'PUT', body: form });
      toast.exito('Materia actualizada.');
      setEditando(false);
      onCambio();
    } catch (err) {
      toast.error(err.errores ? Object.values(err.errores).join(' · ') : err.message);
    }
  };

  const eliminar = async () => {
    const ok = await confirmar({
      titulo: `¿Eliminar ${m.nombre_materia}?`,
      mensaje: 'Esta acción no se puede deshacer. Si algún tutor la enseña o tiene solicitudes, no se podrá eliminar.',
      confirmar: 'Eliminar materia',
      peligro: true,
    });
    if (!ok) return;
    try {
      await api(`/materias/${m.id_materia}`, { method: 'DELETE' });
      toast.info(`${m.nombre_materia} eliminada.`);
      onCambio();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (editando) {
    return (
      <tr>
        <td colSpan={4}>
          <form className="form-linea" onSubmit={guardar}>
            <input
              className="input"
              aria-label="Código"
              value={form.codigo_materia}
              onChange={(e) => setForm({ ...form, codigo_materia: e.target.value })}
              style={{ maxWidth: 160 }}
            />
            <input
              className="input"
              aria-label="Nombre"
              value={form.nombre_materia}
              onChange={(e) => setForm({ ...form, nombre_materia: e.target.value })}
            />
            <button type="submit" className="btn btn-primario btn-sm">
              <Check size={15} /> Guardar
            </button>
            <button type="button" className="btn btn-fantasma btn-sm" onClick={() => setEditando(false)}>
              <X size={15} /> Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <span className="codigo">{m.codigo_materia}</span>
      </td>
      <td>
        <span className="fila">
          <IconoArea codigo={m.codigo_materia} tamano={16} />
          <strong>{m.nombre_materia}</strong>
        </span>
      </td>
      <td className="texto-suave">{areaDe(m.codigo_materia).nombre}</td>
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <button type="button" className="icono-btn" aria-label={`Editar ${m.nombre_materia}`} onClick={() => setEditando(true)}>
          <Pencil size={16} />
        </button>
        <button type="button" className="icono-btn" aria-label={`Eliminar ${m.nombre_materia}`} onClick={eliminar}>
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}

export default function AdminMaterias() {
  const { toast } = useUI();
  const { data, error, cargando, recargar } = useCarga(() => api('/materias'), []);
  const [filtro, setFiltro] = useState('');
  const [area, setArea] = useState('');
  const [nueva, setNueva] = useState({ codigo_materia: '', nombre_materia: '' });
  const [errorCrear, setErrorCrear] = useState(null);

  const areas = useMemo(() => agruparPorArea(data?.materias ?? []), [data]);
  const materias = useMemo(() => {
    const f = normalizar(filtro);
    return (data?.materias ?? [])
      .filter((m) => !area || prefijo(m.codigo_materia) === area)
      .filter((m) => !f || normalizar(`${m.codigo_materia} ${m.nombre_materia}`).includes(f));
  }, [data, filtro, area]);

  const crear = async (e) => {
    e.preventDefault();
    setErrorCrear(null);
    try {
      await api('/materias', { method: 'POST', body: nueva });
      toast.exito(`${nueva.nombre_materia} agregada al catálogo.`);
      setNueva({ codigo_materia: '', nombre_materia: '' });
      recargar();
    } catch (err) {
      setErrorCrear(err);
    }
  };

  return (
    <div className="pagina">
      <EncabezadoPagina
        icono={BookOpen}
        titulo="Materias"
        descripcion="Administra el catálogo de materias disponibles para tutorías. El prefijo del código define el área."
      />

      <form className="tarjeta" onSubmit={crear}>
        <div className="tarjeta-cabecera">
          <h2>
            <Plus size={18} /> Nueva materia
          </h2>
        </div>
        <MensajeError error={errorCrear && !Object.keys(errorCrear.errores || {}).length ? errorCrear : null} />
        <div className="form-linea">
          <Campo label="Código" error={errorCrear?.errores?.codigo_materia} ayuda="Ej. QUI-101 (QUI = área)">
            <input value={nueva.codigo_materia} onChange={(e) => setNueva({ ...nueva, codigo_materia: e.target.value })} />
          </Campo>
          <Campo label="Nombre" error={errorCrear?.errores?.nombre_materia} ayuda="Ej. Química General">
            <input value={nueva.nombre_materia} onChange={(e) => setNueva({ ...nueva, nombre_materia: e.target.value })} />
          </Campo>
          <button type="submit" className="btn btn-primario" style={{ marginBottom: '1.4rem' }}>
            <Plus size={17} /> Agregar
          </button>
        </div>
      </form>

      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Esqueleto filas={4} alto={48} />}

      {data && (
        <section className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="fila-entre" style={{ alignItems: 'center' }}>
              <span className="input-con-icono" style={{ flex: '1 1 260px', maxWidth: 380 }}>
                <Search size={17} aria-hidden="true" />
                <input
                  className="input"
                  type="search"
                  placeholder="Buscar por código o nombre"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  aria-label="Buscar materias"
                />
              </span>
              <span className="texto-suave">
                {materias.length} de {data.materias.length}
              </span>
            </div>
            <div className="chips-filtro">
              <Chip activo={!area} onClick={() => setArea('')}>
                Todas
              </Chip>
              {areas.map((a) => (
                <Chip key={a.clave} activo={area === a.clave} onClick={() => setArea(a.clave)}>
                  {a.nombre} · {a.materias.length}
                </Chip>
              ))}
            </div>
          </div>

          {materias.length === 0 ? (
            <div style={{ padding: '0 1.25rem 1.25rem' }}>
              <Vacio icono={Search} titulo="Sin resultados" />
            </div>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Materia</th>
                    <th>Área</th>
                    <th>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materias.map((m) => (
                    <FilaMateria key={m.id_materia} m={m} onCambio={recargar} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
