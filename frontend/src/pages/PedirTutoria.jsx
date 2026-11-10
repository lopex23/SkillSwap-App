import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CirclePlus, Lightbulb, Search, Send, Users } from 'lucide-react';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import { useUI } from '../context/UIContext';
import { Alerta, Campo, Chip, EncabezadoPagina, Esqueleto, IconoArea, MensajeError, Vacio } from '../components/ui';
import { agruparPorArea, areaDe, prefijo } from '../utils/areas';
import { normalizar } from '../utils/formato';

const PASOS = ['Materia', 'Detalles', 'Confirmar'];

async function cargar() {
  const [materias, tutores] = await Promise.all([api('/materias'), api('/tutores')]);
  // Cuántos tutores dictan cada materia
  const porMateria = {};
  for (const t of tutores.tutores) for (const m of t.materias) porMateria[m.id_materia] = (porMateria[m.id_materia] || 0) + 1;
  return { materias: materias.materias, porMateria };
}

function Pasos({ actual }) {
  return (
    <ol className="asistente-pasos">
      {PASOS.map((p, i) => {
        const n = i + 1;
        const clase = n === actual ? 'activo' : n < actual ? 'hecho' : '';
        return (
          <li key={p} className={clase} aria-current={n === actual ? 'step' : undefined}>
            <span className="asistente-num">{n < actual ? <Check size={14} strokeWidth={3} /> : n}</span>
            <span>{p}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function PedirTutoria() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useUI();
  const { data, error: errorCarga, cargando, recargar } = useCarga(cargar, []);
  const [paso, setPaso] = useState(1);
  const [filtro, setFiltro] = useState('');
  const [area, setArea] = useState('');
  const [idMateria, setIdMateria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // ?materia=ID (desde el directorio o un perfil) preselecciona y salta al paso 2
  useEffect(() => {
    const preseleccion = params.get('materia');
    if (data && preseleccion && data.materias.some((m) => String(m.id_materia) === preseleccion)) {
      setIdMateria(preseleccion);
      setPaso(2);
    }
  }, [data, params]);

  const areas = useMemo(() => agruparPorArea(data?.materias ?? []), [data]);
  const materias = useMemo(() => {
    const f = normalizar(filtro);
    return (data?.materias ?? [])
      .filter((m) => !area || prefijo(m.codigo_materia) === area)
      .filter((m) => !f || normalizar(`${m.nombre_materia} ${m.codigo_materia}`).includes(f));
  }, [data, filtro, area]);

  const seleccionada = data?.materias.find((m) => String(m.id_materia) === String(idMateria));
  const nTutores = seleccionada ? data.porMateria[seleccionada.id_materia] || 0 : 0;
  const largo = descripcion.trim().length;

  const enviar = async () => {
    setError(null);
    setEnviando(true);
    try {
      const { solicitud } = await api('/solicitudes', {
        method: 'POST',
        body: { id_materia: Number(idMateria), descripcion },
      });
      toast.exito('¡Solicitud enviada! Los tutores de la materia ya pueden verla.');
      navigate(`/solicitudes/${solicitud.id_solicitud}`);
    } catch (err) {
      setError(err);
      setEnviando(false);
      if (err.errores?.descripcion) setPaso(2);
    }
  };

  return (
    <div className="pagina pagina-estrecha">
      <EncabezadoPagina
        icono={CirclePlus}
        titulo="Pedir una tutoría"
        descripcion="Cuéntanos qué necesitas y te sugeriremos tutores que dominan la materia."
      />

      <Pasos actual={paso} />

      <MensajeError error={errorCarga} onReintentar={recargar} />
      {cargando && <Esqueleto filas={2} alto={120} />}

      {data && paso === 1 && (
        <section className="tarjeta formulario">
          <h2>¿En qué materia necesitas ayuda?</h2>
          <span className="input-con-icono">
            <Search size={17} aria-hidden="true" />
            <input
              className="input"
              type="search"
              placeholder="Busca por nombre o código: cálculo, DER-101, inglés…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              aria-label="Buscar materia"
            />
          </span>
          <div className="chips-filtro">
            <Chip activo={!area} onClick={() => setArea('')}>
              Todas
            </Chip>
            {areas.map((a) => (
              <Chip key={a.clave} activo={area === a.clave} onClick={() => setArea(a.clave)}>
                {a.nombre}
              </Chip>
            ))}
          </div>

          {materias.length === 0 ? (
            <Vacio icono={Search} titulo="No encontramos esa materia">
              Prueba con otra palabra o pide al administrador que la agregue al catálogo.
            </Vacio>
          ) : (
            <div className="materia-opciones" role="radiogroup" aria-label="Materias">
              {materias.map((m) => {
                const n = data.porMateria[m.id_materia] || 0;
                const activa = String(m.id_materia) === String(idMateria);
                return (
                  <button
                    key={m.id_materia}
                    type="button"
                    role="radio"
                    aria-checked={activa}
                    className={activa ? 'materia-opcion seleccionada' : 'materia-opcion'}
                    onClick={() => setIdMateria(String(m.id_materia))}
                  >
                    <IconoArea codigo={m.codigo_materia} />
                    <span className="apilado">
                      <span className="materia-opcion-nombre">{m.nombre_materia}</span>
                      <span className="materia-opcion-meta">
                        {m.codigo_materia} · {n === 0 ? 'sin tutores aún' : `${n} tutor${n === 1 ? '' : 'es'}`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="fila-entre">
            <span className="texto-suave">{seleccionada ? `Elegiste ${seleccionada.nombre_materia}` : 'Elige una materia para continuar'}</span>
            <button type="button" className="btn btn-primario" disabled={!seleccionada} onClick={() => setPaso(2)}>
              Continuar <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {data && paso === 2 && seleccionada && (
        <section className="tarjeta formulario">
          <div className="fila">
            <IconoArea codigo={seleccionada.codigo_materia} tamano={20} />
            <div className="apilado">
              <span className="titulo-item">{seleccionada.nombre_materia}</span>
              <span className="texto-suave">{areaDe(seleccionada.codigo_materia).nombre}</span>
            </div>
          </div>

          <Campo
            label="¿En qué necesitas ayuda?"
            error={error?.errores?.descripcion}
            ayuda={`${largo}/1000 caracteres · mínimo 10`}
          >
            <textarea
              rows={6}
              maxLength={1000}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Tengo parcial el viernes y no entiendo la regla de la cadena ni las derivadas implícitas."
              autoFocus
            />
          </Campo>

          <div className="panel-accion">
            <p className="campo-label" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <Lightbulb size={16} /> Una buena descripción ayuda al tutor a prepararse
            </p>
            <ul className="consejos">
              <li>
                <Check size={15} /> Menciona el tema o capítulo exacto.
              </li>
              <li>
                <Check size={15} /> Cuenta para cuándo lo necesitas (parcial, entrega, examen).
              </li>
              <li>
                <Check size={15} /> Di qué ya intentaste o dónde te quedas atascado.
              </li>
            </ul>
          </div>

          <div className="fila-entre">
            <button type="button" className="btn btn-fantasma" onClick={() => setPaso(1)}>
              <ArrowLeft size={16} /> Cambiar materia
            </button>
            <button type="button" className="btn btn-primario" disabled={largo < 10} onClick={() => setPaso(3)}>
              Revisar <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {data && paso === 3 && seleccionada && (
        <section className="tarjeta formulario">
          <h2>Revisa tu solicitud</h2>
          <MensajeError error={error && !error.errores?.descripcion ? error : null} />

          <div className="panel-accion">
            <div className="fila">
              <IconoArea codigo={seleccionada.codigo_materia} tamano={20} />
              <div className="apilado">
                <span className="titulo-item">{seleccionada.nombre_materia}</span>
                <span className="codigo">{seleccionada.codigo_materia}</span>
              </div>
            </div>
            <p className="descripcion">{descripcion.trim()}</p>
          </div>

          {nTutores > 0 ? (
            <Alerta tipo="exito" icono={Users}>
              {nTutores} tutor{nTutores === 1 ? '' : 'es'} dicta{nTutores === 1 ? '' : 'n'} esta materia. Te mostraremos los más afines
              al enviar.
            </Alerta>
          ) : (
            <Alerta tipo="aviso" icono={Users}>
              Todavía ningún tutor dicta esta materia. Tu solicitud quedará visible para cualquier tutor que la agregue.
            </Alerta>
          )}

          <div className="fila-entre">
            <button type="button" className="btn btn-fantasma" onClick={() => setPaso(2)}>
              <ArrowLeft size={16} /> Editar
            </button>
            <button type="button" className="btn btn-primario btn-lg" disabled={enviando} onClick={enviar}>
              <Send size={17} /> {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
