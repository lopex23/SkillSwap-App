import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import { Campo, Cargando, Estado, Estrellas, EstrellasInput, MensajeError, Pestanas, Vacio } from '../components/ui';
import { nombreCompleto, rangoSesion } from '../utils/formato';

const FILTROS = [
  { valor: 'programada', etiqueta: 'Programadas' },
  { valor: 'completada', etiqueta: 'Completadas' },
  { valor: 'cancelada', etiqueta: 'Canceladas' },
  { valor: '', etiqueta: 'Todas' },
];

function FormCalificar({ idSesion, onListo }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await api(`/sesiones/${idSesion}/calificar`, { method: 'POST', body: { puntuacion, comentario } });
      onListo();
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  return (
    <form className="calificar-form" onSubmit={enviar}>
      <p className="campo-label">¿Cómo te fue con tu tutor?</p>
      <EstrellasInput valor={puntuacion} onChange={setPuntuacion} />
      <Campo label="Comentario (opcional)">
        <textarea rows={2} maxLength={1000} value={comentario} onChange={(e) => setComentario(e.target.value)} />
      </Campo>
      <MensajeError error={error} />
      <button type="submit" className="btn btn-primario btn-sm" disabled={!puntuacion || enviando}>
        {enviando ? 'Enviando…' : 'Enviar calificación'}
      </button>
    </form>
  );
}

function TarjetaSesion({ s, idUsuario, onCambio, onError }) {
  const soyTutor = s.tutor.id_tutor === idUsuario;
  const yaEmpezo = new Date(s.fecha_inicio) <= new Date();
  const [ocupado, setOcupado] = useState(false);

  const accion = async (ruta, confirmacion) => {
    if (confirmacion && !window.confirm(confirmacion)) return;
    setOcupado(true);
    onError(null);
    try {
      await api(`/sesiones/${s.id_sesion}/${ruta}`, { method: 'PATCH' });
      onCambio();
    } catch (err) {
      onError(err);
      setOcupado(false);
    }
  };

  return (
    <li className="tarjeta item item-columna">
      <div className="item-fila">
        <div>
          <p className="item-titulo">{s.materia.nombre_materia}</p>
          <p className="texto-suave">
            {soyTutor ? `Estudiante: ${nombreCompleto(s.estudiante)}` : `Tutor: ${nombreCompleto(s.tutor)}`}
            {' · '}
            {s.modalidad}
            {soyTutor ? ' · tú enseñas' : ''}
          </p>
        </div>
        <Estado valor={s.estado} />
      </div>
      <p className="item-fecha">{rangoSesion(s.fecha_inicio, s.fecha_fin)}</p>

      {s.calificacion && (
        <div className="calificacion">
          <Estrellas valor={s.calificacion.puntuacion} />
          {s.calificacion.comentario && <p className="item-descripcion">“{s.calificacion.comentario}”</p>}
        </div>
      )}

      {s.estado === 'programada' && (
        <div className="acciones">
          {soyTutor && (
            <button
              type="button"
              className="btn btn-primario btn-sm"
              disabled={!yaEmpezo || ocupado}
              title={yaEmpezo ? '' : 'Podrás completarla cuando empiece'}
              onClick={() => accion('completar')}
            >
              Marcar como completada
            </button>
          )}
          <button
            type="button"
            className="btn btn-peligro btn-sm"
            disabled={ocupado}
            onClick={() =>
              accion(
                'cancelar',
                soyTutor
                  ? '¿Cancelar la sesión? La solicitud volverá a quedar disponible para otros tutores.'
                  : '¿Cancelar la sesión? Tu solicitud también se cancelará.'
              )
            }
          >
            Cancelar sesión
          </button>
          {soyTutor && !yaEmpezo && <span className="texto-suave">Podrás completarla cuando empiece.</span>}
        </div>
      )}

      {s.estado === 'completada' && !soyTutor && !s.calificacion && (
        <FormCalificar idSesion={s.id_sesion} onListo={onCambio} />
      )}
    </li>
  );
}

export default function Sesiones() {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState('programada');
  const [errorAccion, setErrorAccion] = useState(null);
  const { data, error, cargando, recargar } = useCarga(
    () => api(`/sesiones/mias${estado ? `?estado=${estado}` : ''}`),
    [estado]
  );

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Mis sesiones</h1>
        <p className="texto-suave">Tus tutorías como estudiante y como tutor.</p>
      </header>

      <Pestanas opciones={FILTROS} valor={estado} onChange={setEstado} />
      <MensajeError error={errorAccion} />
      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Cargando />}

      {data && data.sesiones.length === 0 && <Vacio titulo="No hay sesiones en esta categoría" />}

      {data && data.sesiones.length > 0 && (
        <ul className="lista">
          {data.sesiones.map((s) => (
            <TarjetaSesion
              key={s.id_sesion}
              s={s}
              idUsuario={usuario.id_usuario}
              onCambio={recargar}
              onError={setErrorAccion}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
