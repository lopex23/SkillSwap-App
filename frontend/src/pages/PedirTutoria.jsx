import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import { Campo, Cargando, MensajeError } from '../components/ui';
import { normalizar } from '../utils/formato';

export default function PedirTutoria() {
  const navigate = useNavigate();
  const { data, error: errorCarga, cargando, recargar } = useCarga(() => api('/materias'), []);
  const [filtro, setFiltro] = useState('');
  const [idMateria, setIdMateria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const materias = useMemo(() => {
    const f = normalizar(filtro);
    const lista = data?.materias ?? [];
    return f ? lista.filter((m) => normalizar(`${m.nombre_materia} ${m.codigo_materia}`).includes(f)) : lista;
  }, [data, filtro]);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const { solicitud } = await api('/solicitudes', {
        method: 'POST',
        body: { id_materia: Number(idMateria), descripcion },
      });
      navigate(`/solicitudes/${solicitud.id_solicitud}`, { state: { recienCreada: true } });
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  return (
    <div className="pagina pagina-estrecha">
      <header className="pagina-cabecera">
        <h1>Pedir una tutoría</h1>
        <p className="texto-suave">Te sugeriremos tutores que dominan la materia.</p>
      </header>

      <MensajeError error={errorCarga} onReintentar={recargar} />
      {cargando && <Cargando />}

      {data && (
        <form className="tarjeta formulario" onSubmit={enviar} noValidate>
          <MensajeError error={error && !error.errores?.descripcion && !error.errores?.id_materia ? error : null} />

          <Campo label="Buscar materia">
            <input
              type="search"
              placeholder="Ej. cálculo, derecho, inglés…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </Campo>

          <Campo label="Materia" error={error?.errores?.id_materia}>
            <select value={idMateria} onChange={(e) => setIdMateria(e.target.value)} required>
              <option value="">Selecciona una materia ({materias.length})</option>
              {materias.map((m) => (
                <option key={m.id_materia} value={m.id_materia}>
                  {m.nombre_materia} · {m.codigo_materia}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            label="¿En qué necesitas ayuda?"
            error={error?.errores?.descripcion}
            ayuda={`${descripcion.trim().length}/1000 · mínimo 10 caracteres`}
          >
            <textarea
              rows={5}
              maxLength={1000}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Tengo parcial la próxima semana y no entiendo la regla de la cadena."
            />
          </Campo>

          <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando || !idMateria}>
            {enviando ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      )}
    </div>
  );
}
