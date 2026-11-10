import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import AceptarSolicitud from '../components/AceptarSolicitud';
import { Cargando, MensajeError, Vacio } from '../components/ui';
import { formatoFechaHora, nombreCompleto } from '../utils/formato';

export default function Disponibles() {
  const navigate = useNavigate();
  const [abierta, setAbierta] = useState(null);
  const { data, error, cargando, recargar } = useCarga(() => api('/solicitudes/disponibles'), []);

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Solicitudes disponibles</h1>
        <p className="texto-suave">Estudiantes que necesitan ayuda en las materias que enseñas.</p>
      </header>

      <MensajeError error={error} onReintentar={recargar} />
      {cargando && <Cargando />}

      {data && data.solicitudes.length === 0 && (
        <Vacio titulo="No hay solicitudes pendientes en tus materias">
          Asegúrate de tener tus materias registradas en <Link to="/perfil-tutor">tu perfil de tutor</Link>.
        </Vacio>
      )}

      {data && data.solicitudes.length > 0 && (
        <ul className="lista">
          {data.solicitudes.map((s) => (
            <li key={s.id_solicitud} className="tarjeta item item-columna">
              <div className="item-fila">
                <div>
                  <p className="item-titulo">{s.materia.nombre_materia}</p>
                  <p className="texto-suave">
                    {nombreCompleto(s.estudiante)}
                    {s.estudiante.carrera ? ` · ${s.estudiante.carrera}` : ''}
                    {s.estudiante.semestre ? ` · semestre ${s.estudiante.semestre}` : ''}
                  </p>
                </div>
                <p className="texto-suave">{formatoFechaHora(s.fecha_solicitud)}</p>
              </div>
              <p className="item-descripcion">{s.descripcion}</p>

              {abierta === s.id_solicitud ? (
                <AceptarSolicitud
                  idSolicitud={s.id_solicitud}
                  onAceptada={() => navigate('/sesiones')}
                  onCancelar={() => setAbierta(null)}
                />
              ) : (
                <div className="acciones">
                  <button type="button" className="btn btn-primario btn-sm" onClick={() => setAbierta(s.id_solicitud)}>
                    Aceptar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
