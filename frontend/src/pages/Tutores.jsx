import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Award, CirclePlus, Search, Sparkles, Users } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import {
  Avatar,
  Chip,
  EncabezadoPagina,
  Esqueleto,
  Estrellas,
  Insignia,
  MensajeError,
  SemanaMini,
  Vacio,
} from '../components/ui';
import { DIAS } from '../components/Semana';
import { agruparPorArea, prefijo } from '../utils/areas';
import { capitalizar, nombreCompleto, normalizar } from '../utils/formato';

const ORDENES = {
  reputacion: (a, b) => (Number(b.reputacion_promedio) || 0) - (Number(a.reputacion_promedio) || 0) || b.total_tutorias - a.total_tutorias,
  tutorias: (a, b) => (b.total_tutorias || 0) - (a.total_tutorias || 0),
  nombre: (a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'),
};

export function insigniasTutor(t) {
  const rep = Number(t.reputacion_promedio);
  const lista = [];
  if (rep >= 4.5 && t.total_tutorias >= 3) lista.push({ tono: 'acento', icono: Award, texto: 'Destacado' });
  if (!t.total_tutorias) lista.push({ tono: 'info', icono: Sparkles, texto: 'Nuevo' });
  return lista;
}

function TutorTarjeta({ t, idMateria, puedePedir }) {
  const visibles = t.materias.slice(0, 3);
  const resto = t.materias.length - visibles.length;
  return (
    <li className="tarjeta tarjeta-interactiva tutor-tarjeta">
      <div className="fila-entre">
        <div className="fila">
          <Avatar persona={t} id={t.id_tutor} tamano="lg" />
          <div className="apilado">
            <Link to={`/tutores/${t.id_tutor}`} className="titulo-item">
              {nombreCompleto(t)}
            </Link>
            <span className="texto-suave" style={{ fontSize: '0.84rem' }}>
              {t.carrera || 'Carrera no indicada'}
              {t.semestre ? ` · sem. ${t.semestre}` : ''}
            </span>
          </div>
        </div>
        <div className="apilado" style={{ alignItems: 'flex-end' }}>
          {insigniasTutor(t).map((i) => (
            <Insignia key={i.texto} tono={i.tono} icono={i.icono}>
              {i.texto}
            </Insignia>
          ))}
        </div>
      </div>

      <Estrellas valor={t.reputacion_promedio} total={t.total_tutorias ?? 0} />

      <div className="chips">
        {t.materias.length === 0 ? (
          <span className="texto-suave">Sin materias registradas</span>
        ) : (
          <>
            {visibles.map((m) => (
              <Chip key={m.id_materia}>{m.nombre_materia}</Chip>
            ))}
            {resto > 0 && <Chip>+{resto}</Chip>}
          </>
        )}
      </div>

      <div className="tutor-tarjeta-pie">
        <SemanaMini disponibilidad={t.disponibilidad} />
        {puedePedir && idMateria ? (
          <Link to={`/solicitudes/nueva?materia=${idMateria}`} className="btn btn-primario btn-sm">
            <CirclePlus size={15} /> Pedir tutoría
          </Link>
        ) : (
          <Link to={`/tutores/${t.id_tutor}`} className="btn btn-secundario btn-sm">
            Ver perfil
          </Link>
        )}
      </div>
    </li>
  );
}

export default function Tutores() {
  const { usuario, tieneRol } = useAuth();
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState('');
  const [dia, setDia] = useState('');
  const [orden, setOrden] = useState('reputacion');
  const materia = params.get('materia') || '';
  const area = params.get('area') || '';

  const catalogo = useCarga(() => api('/materias'), []);
  const { data, error, cargando, recargar } = useCarga(() => api('/tutores'), []);
  const areas = useMemo(() => agruparPorArea(catalogo.data?.materias ?? []), [catalogo.data]);

  const cambiarParam = (clave, valor) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    if (clave === 'area') p.delete('materia');
    setParams(p, { replace: true });
  };

  const tutores = useMemo(() => {
    const t = normalizar(texto);
    return (data?.tutores ?? [])
      .filter((x) => x.id_tutor !== usuario.id_usuario)
      .filter((x) => !t || normalizar(`${nombreCompleto(x)} ${x.carrera ?? ''}`).includes(t))
      .filter((x) => !materia || x.materias.some((m) => String(m.id_materia) === materia))
      .filter((x) => !area || x.materias.some((m) => prefijo(m.codigo_materia) === area))
      .filter((x) => !dia || x.disponibilidad.some((d) => d.dia_semana === dia))
      .sort(ORDENES[orden]);
  }, [data, texto, materia, area, dia, orden, usuario.id_usuario]);

  const materiasVisibles = area ? areas.find((a) => a.clave === area)?.materias ?? [] : catalogo.data?.materias ?? [];
  const hayFiltros = texto || materia || area || dia;

  return (
    <div className="pagina">
      <EncabezadoPagina
        icono={Users}
        titulo="Explorar tutores"
        descripcion="Encuentra a quien pueda ayudarte según la materia, el día y su reputación."
      />

      <div className="tarjeta barra-filtros" role="search">
        <label className="campo">
          <span className="campo-label">Buscar</span>
          <span className="input-con-icono">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Nombre o carrera del tutor"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </span>
        </label>
        <label className="campo">
          <span className="campo-label">Materia</span>
          <select value={materia} onChange={(e) => cambiarParam('materia', e.target.value)}>
            <option value="">Todas</option>
            {materiasVisibles.map((m) => (
              <option key={m.id_materia} value={m.id_materia}>
                {m.nombre_materia}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="campo-label">Disponible el</span>
          <select value={dia} onChange={(e) => setDia(e.target.value)}>
            <option value="">Cualquier día</option>
            {DIAS.map((d) => (
              <option key={d} value={d}>
                {capitalizar(d)}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="campo-label">Ordenar por</span>
          <select value={orden} onChange={(e) => setOrden(e.target.value)}>
            <option value="reputacion">Mejor reputación</option>
            <option value="tutorias">Más tutorías</option>
            <option value="nombre">Nombre</option>
          </select>
        </label>
      </div>

      {areas.length > 0 && (
        <div className="chips-filtro" aria-label="Filtrar por área">
          <Chip activo={!area} onClick={() => cambiarParam('area', '')}>
            Todas las áreas
          </Chip>
          {areas.map((a) => (
            <Chip key={a.clave} activo={area === a.clave} onClick={() => cambiarParam('area', a.clave)}>
              {a.nombre}
            </Chip>
          ))}
        </div>
      )}

      <MensajeError error={error || catalogo.error} onReintentar={recargar} />
      {cargando && <Esqueleto filas={2} alto={180} />}

      {data && (
        <>
          <div className="fila-entre">
            <p className="texto-suave">
              {tutores.length} tutor{tutores.length === 1 ? '' : 'es'} encontrado{tutores.length === 1 ? '' : 's'}
            </p>
            {hayFiltros && (
              <button
                type="button"
                className="btn-enlace"
                onClick={() => {
                  setTexto('');
                  setDia('');
                  setParams({}, { replace: true });
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {tutores.length === 0 ? (
            <Vacio
              icono={Users}
              titulo={hayFiltros ? 'Ningún tutor coincide con los filtros' : 'Todavía no hay tutores registrados'}
              accion={
                tieneRol('estudiante') && (
                  <Link to={materia ? `/solicitudes/nueva?materia=${materia}` : '/solicitudes/nueva'} className="btn btn-primario btn-sm">
                    <CirclePlus size={16} /> Crear una solicitud igual
                  </Link>
                )
              }
            >
              Cuando un tutor agregue la materia, podrá ver tu solicitud y aceptarla.
            </Vacio>
          ) : (
            <ul className="grid-tarjetas">
              {tutores.map((t) => (
                <TutorTarjeta key={t.id_tutor} t={t} idMateria={materia} puedePedir={tieneRol('estudiante')} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
