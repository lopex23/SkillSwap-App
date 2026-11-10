import { Link } from 'react-router-dom';
import { BookOpen, CalendarCheck, ChartColumn, CirclePlus, Flame, Trophy } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import { BarraProgreso, EncabezadoPagina, Esqueleto, IconoArea, MensajeError, TarjetaDato, Vacio } from '../components/ui';
import { formatoFecha } from '../utils/formato';

async function cargar(idUsuario) {
  const [progreso, sesiones] = await Promise.all([api('/sesiones/progreso'), api('/sesiones/mias?rol=estudiante')]);
  const completadas = sesiones.sesiones
    .filter((s) => s.estado === 'completada' && s.estudiante.id_estudiante === idUsuario)
    .sort((a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin));
  return { progreso: progreso.progreso, ultima: completadas[0] ?? null };
}

export default function Progreso() {
  const { usuario } = useAuth();
  const { data, error, cargando, recargar } = useCarga(() => cargar(usuario.id_usuario), [usuario.id_usuario]);
  const lista = data?.progreso ?? [];
  const max = Math.max(1, ...lista.map((p) => p.sesiones_completadas));
  const total = lista.reduce((s, p) => s + p.sesiones_completadas, 0);

  return (
    <div className="pagina pagina-estrecha">
      <EncabezadoPagina icono={ChartColumn} titulo="Mi progreso" descripcion="Sesiones de tutoría completadas por materia." />

      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Esqueleto filas={2} alto={110} />}

      {data && lista.length === 0 && (
        <Vacio
          icono={Trophy}
          titulo="Aún no has completado sesiones"
          accion={
            <Link to="/solicitudes/nueva" className="btn btn-primario btn-sm">
              <CirclePlus size={16} /> Pedir mi primera tutoría
            </Link>
          }
        >
          Cada sesión completada suma aquí y te muestra en qué materias te has reforzado.
        </Vacio>
      )}

      {data && lista.length > 0 && (
        <>
          <div className="grid-datos">
            <TarjetaDato icono={CalendarCheck} valor={total} etiqueta="Sesiones completadas" tono="exito" />
            <TarjetaDato icono={BookOpen} valor={lista.length} etiqueta="Materias reforzadas" tono="info" />
            <TarjetaDato
              icono={Flame}
              valor={data.ultima ? formatoFecha(data.ultima.fecha_fin) : '—'}
              etiqueta="Última sesión"
              tono="acento"
              detalle={data.ultima?.materia.nombre_materia}
            />
          </div>

          <section className="tarjeta">
            <div className="tarjeta-cabecera">
              <h2>
                <ChartColumn size={18} /> Por materia
              </h2>
            </div>
            <ul className="lista-simple">
              {lista.map((p) => (
                <li key={p.id_materia}>
                  <span className="fila" style={{ flex: '1 1 220px' }}>
                    <IconoArea codigo={p.codigo_materia} />
                    <span className="titulo-item">{p.nombre_materia}</span>
                  </span>
                  <span className="fila" style={{ flex: '1 1 220px' }}>
                    <BarraProgreso valor={p.sesiones_completadas} max={max} degradado etiqueta={p.nombre_materia} />
                    <strong style={{ minWidth: '5.5rem', textAlign: 'right' }}>
                      {p.sesiones_completadas} sesión{p.sesiones_completadas === 1 ? '' : 'es'}
                    </strong>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
