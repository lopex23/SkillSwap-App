import { useState } from 'react';
import { api } from '../api/client';
import { Campo, MensajeError } from './ui';
import { hoyLocal } from '../utils/formato';

const DURACIONES = [30, 60, 90, 120, 180, 240];

// Formulario con el que un tutor acepta una solicitud y programa la sesión.
export default function AceptarSolicitud({ idSolicitud, onAceptada, onCancelar }) {
  const [form, setForm] = useState({ fecha: '', hora: '15:00', duracion: 60, modalidad: 'virtual' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.fecha) {
      setError({ message: 'Elige la fecha de la sesión' });
      return;
    }
    // La hora se toma en la zona horaria del navegador y se envía en UTC (ISO con Z)
    const inicio = new Date(`${form.fecha}T${form.hora}`);
    const fin = new Date(inicio.getTime() + Number(form.duracion) * 60000);
    setEnviando(true);
    try {
      const d = await api(`/solicitudes/${idSolicitud}/aceptar`, {
        method: 'POST',
        body: { fecha_inicio: inicio.toISOString(), fecha_fin: fin.toISOString(), modalidad: form.modalidad },
      });
      onAceptada(d.solicitud);
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  const errores = error?.errores || {};

  return (
    <form className="aceptar-form" onSubmit={enviar} noValidate>
      <MensajeError error={error && !errores.fecha_inicio && !errores.fecha_fin && !errores.modalidad ? error : null} />
      <div className="fila-4">
        <Campo label="Fecha" error={errores.fecha_inicio}>
          <input type="date" name="fecha" min={hoyLocal()} value={form.fecha} onChange={cambiar} required />
        </Campo>
        <Campo label="Hora de inicio">
          <input type="time" name="hora" value={form.hora} onChange={cambiar} required />
        </Campo>
        <Campo label="Duración" error={errores.fecha_fin}>
          <select name="duracion" value={form.duracion} onChange={cambiar}>
            {DURACIONES.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60} h`}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Modalidad" error={errores.modalidad}>
          <select name="modalidad" value={form.modalidad} onChange={cambiar}>
            <option value="virtual">Virtual</option>
            <option value="presencial">Presencial</option>
          </select>
        </Campo>
      </div>
      <div className="acciones">
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? 'Programando…' : 'Aceptar y programar'}
        </button>
        {onCancelar && (
          <button type="button" className="btn btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
