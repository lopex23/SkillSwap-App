import { useMemo, useState } from 'react';
import { CalendarClock, CalendarDays, CircleCheck, MapPin, Star, Video } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import { useUI } from '../context/UIContext';
import {
  Avatar,
  Campo,
  EncabezadoPagina,
  Esqueleto,
  Estado,
  Estrellas,
  EstrellasInput,
  FechaTile,
  IconoArea,
  Insignia,
  MensajeError,
  Pestanas,
  Vacio,
} from '../components/ui';
import { etiquetaDia, momentoSesion, nombreCompleto, rangoHoras, tiempoRelativo } from '../utils/formato';

function FormCalificar({ s, onListo }) {
  const { toast } = useUI();
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api(`/sesiones/${s.id_sesion}/calificar`, { method: 'POST', body: { puntuacion, comentario } });
      toast.exito(`¡Gracias! Tu calificación ayuda a otros estudiantes a elegir tutor.`);
      onListo();
    } catch (err) {
      toast.error(err.message);
      setEnviando(false);
    }
  };

  return (
    <form className="panel-accion" onSubmit={enviar}>
      <span className="campo-label">¿Cómo te fue con {s.tutor.nombre}?</span>
      <EstrellasInput valor={puntuacion} onChange={setPuntuacion} />
      <Campo label="Comentario (opcional)">
        <textarea
          rows={2}
          maxLength={1000}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="¿Qué fue lo más útil de la sesión?"
          style={{ minHeight: 70 }}
        />
      </Campo>
      <div>
        <button type="submit" className="btn btn-primario btn-sm" disabled={!puntuacion || enviando}>
          <Star size={15} /> {enviando ? 'Enviando…' : 'Enviar calificación'}
        </button>
      </div>
    </form>
  );
}

function MomentoInsignia({ s }) {
  if (s.estado !== 'programada') return <Estado valor={s.estado} />;
  const m = momentoSesion(s.fecha_inicio, s.fecha_fin);
  if (m === 'en-curso') return <Insignia tono="exito">En curso</Insignia>;
  if (m === 'pasada') return <Insignia tono="aviso">Por completar</Insignia>;
  return <Insignia tono="info">{tiempoRelativo(s.fecha_inicio)}</Insignia>;
}

function TarjetaSesion({ s, idUsuario, onCambio }) {
  const { toast, confirmar } = useUI();
  const [ocupado, setOcupado] = useState(false);
  const soyTutor = s.tutor.id_tutor === idUsuario;
  const otro = soyTutor ? s.estudiante : s.tutor;
  const idOtro = soyTutor ? s.estudiante.id_estudiante : s.tutor.id_tutor;
  const empezo = new Date(s.fecha_inicio) <= new Date();
  const Modalidad = s.modalidad === 'virtual' ? Video : MapPin;

  const completar = async () => {
    setOcupado(true);
    try {
      await api(`/sesiones/${s.id_sesion}/completar`, { method: 'PATCH' });
      toast.exito('Sesión completada. ¡Buen trabajo!');
      onCambio();
    } catch (err) {
      toast.error(err.message);
      setOcupado(false);
    }
  };

  const cancelar = async () => {
    const ok = await confirmar({
      titulo: '¿Cancelar esta sesión?',
      mensaje: soyTutor
        ? 'La solicitud volverá a quedar disponible para que otro tutor la tome.'
        : 'Tu solicitud también se cancelará. Podrás crear una nueva cuando quieras.',
      confirmar: 'Cancelar sesión',
      cancelar: 'Mantener',
      peligro: true,
    });
    if (!ok) return;
    setOcupado(true);
    try {
      await api(`/sesiones/${s.id_sesion}/cancelar`, { method: 'PATCH' });
      toast.info('Sesión cancelada.');
      onCambio();
    } catch (err) {
      toast.error(err.message);
      setOcupado(false);
    }
  };

  return (
    <li className="tarjeta sesion-item">
      <FechaTile iso={s.fecha_inicio} />
      <div className="sesion-cuerpo">
        <div className="fila-entre">
          <div className="fila">
            <IconoArea codigo={s.materia.codigo_materia} />
            <div className="apilado">
              <span className="titulo-item">{s.materia.nombre_materia}</span>
              <span className="meta">
                <span>
                  <CalendarClock size={14} /> {rangoHoras(s.fecha_inicio, s.fecha_fin)}
                </span>
                <span>
                  <Modalidad size={14} /> {s.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                </span>
              </span>
            </div>
          </div>
          <MomentoInsignia s={s} />
        </div>

        <div className="fila">
          <Avatar persona={otro} id={idOtro} tamano="sm" />
          <span className="texto-suave">
            {soyTutor ? 'Estudiante' : 'Tutor'}: <strong style={{ color: 'var(--texto)' }}>{nombreCompleto(otro)}</strong>
          </span>
          <Insignia tono={soyTutor ? 'acento' : 'primario'}>{soyTutor ? 'Enseñas' : 'Aprendes'}</Insignia>
        </div>

        {s.calificacion && (
          <div className="calificacion">
            <Estrellas valor={s.calificacion.puntuacion} />
            {s.calificacion.comentario && <p className="descripcion">“{s.calificacion.comentario}”</p>}
          </div>
        )}

        {s.estado === 'programada' && (
          <div className="acciones">
            {soyTutor && (
              <button
                type="button"
                className="btn btn-primario btn-sm"
                disabled={!empezo || ocupado}
                title={empezo ? '' : 'Podrás completarla cuando empiece'}
                onClick={completar}
              >
                <CircleCheck size={16} /> Marcar como completada
              </button>
            )}
            <button type="button" className="btn btn-peligro btn-sm" disabled={ocupado} onClick={cancelar}>
              Cancelar sesión
            </button>
            {soyTutor && !empezo && <span className="texto-suave">Podrás completarla cuando empiece.</span>}
          </div>
        )}

        {s.estado === 'completada' && !soyTutor && !s.calificacion && <FormCalificar s={s} onListo={onCambio} />}
      </div>
    </li>
  );
}

export default function Sesiones() {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState('programada');
  const { data, error, cargando, recargar } = useCarga(() => api('/sesiones/mias'), []);

  const todas = data?.sesiones ?? [];
  const cuenta = (e) => todas.filter((s) => s.estado === e).length;
  const porCalificar = todas.filter(
    (s) => s.estado === 'completada' && !s.calificacion && s.tutor.id_tutor !== usuario.id_usuario
  ).length;

  // Agrupa por día; las programadas de la más próxima a la más lejana, el resto al revés
  const grupos = useMemo(() => {
    const lista = (estado ? todas.filter((s) => s.estado === estado) : [...todas]).sort((a, b) =>
      estado === 'programada'
        ? new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
        : new Date(b.fecha_inicio) - new Date(a.fecha_inicio)
    );
    const mapa = new Map();
    for (const s of lista) {
      const clave = etiquetaDia(s.fecha_inicio);
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave).push(s);
    }
    return [...mapa.entries()];
  }, [todas, estado]);

  return (
    <div className="pagina">
      <EncabezadoPagina
        icono={CalendarDays}
        titulo="Mis sesiones"
        descripcion="Tus tutorías como estudiante y como tutor."
      />

      {porCalificar > 0 && (
        <div className="alerta alerta-aviso">
          <Star size={18} aria-hidden="true" />
          <span className="alerta-texto">
            Tienes {porCalificar} sesión{porCalificar === 1 ? '' : 'es'} sin calificar.
          </span>
          {estado !== 'completada' && (
            <button type="button" className="btn btn-sm btn-secundario" onClick={() => setEstado('completada')}>
              Calificar ahora
            </button>
          )}
        </div>
      )}

      <Pestanas
        opciones={[
          { valor: 'programada', etiqueta: 'Próximas', cuenta: cuenta('programada') },
          { valor: 'completada', etiqueta: 'Completadas', cuenta: cuenta('completada') },
          { valor: 'cancelada', etiqueta: 'Canceladas', cuenta: cuenta('cancelada') },
          { valor: '', etiqueta: 'Todas', cuenta: todas.length },
        ]}
        valor={estado}
        onChange={setEstado}
      />

      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Esqueleto filas={3} alto={130} />}

      {data && grupos.length === 0 && (
        <Vacio icono={CalendarDays} titulo="No hay sesiones en esta categoría">
          {estado === 'programada' ? 'Las sesiones aparecen aquí cuando un tutor acepta una solicitud.' : null}
        </Vacio>
      )}

      {grupos.map(([dia, sesiones]) => (
        <section key={dia} className="grupo-dia">
          <h2 className="grupo-dia-titulo">{dia}</h2>
          <ul className="lista">
            {sesiones.map((s) => (
              <TarjetaSesion key={s.id_sesion} s={s} idUsuario={usuario.id_usuario} onCambio={recargar} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
