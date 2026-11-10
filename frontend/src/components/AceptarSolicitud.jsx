import { useState } from 'react';
import { CalendarCheck, Clock } from 'lucide-react';
import { api } from '../api/client';
import { useCarga } from '../hooks/useCarga';
import { Campo, Chip, MensajeError } from './ui';
import { DIAS } from './Semana';
import { capitalizar, hoyLocal } from '../utils/formato';

const DURACIONES = [30, 60, 90, 120, 180, 240];

// Próxima fecha (YYYY-MM-DD) que cae en ese día de la semana, a partir de mañana
function proximaFecha(dia) {
  const objetivo = (DIAS.indexOf(dia) + 1) % 7; // getDay(): domingo = 0
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== objetivo) d.setDate(d.getDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const minutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Formulario con el que un tutor acepta una solicitud y programa la sesión.
export default function AceptarSolicitud({ idSolicitud, onAceptada, onCancelar }) {
  const [form, setForm] = useState({ fecha: '', hora: '15:00', duracion: 60, modalidad: 'virtual' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const horarios = useCarga(() => api('/tutores/me/disponibilidad'), []);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Rellena el formulario con una franja de disponibilidad del tutor
  const usarFranja = (f) => {
    const largo = minutos(f.hora_fin) - minutos(f.hora_inicio);
    const duracion = [...DURACIONES].reverse().find((d) => d <= Math.min(largo, 120)) || 30;
    setForm({ ...form, fecha: proximaFecha(f.dia_semana), hora: f.hora_inicio, duracion });
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.fecha) {
      setError({ message: 'Elige la fecha de la sesión', errores: { fecha_inicio: 'Elige una fecha' } });
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
  const franjas = horarios.data?.disponibilidad ?? [];

  return (
    <form className="panel-accion" onSubmit={enviar} noValidate>
      {franjas.length > 0 && (
        <div className="apilado" style={{ gap: '0.45rem' }}>
          <span className="campo-label" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <Clock size={15} /> Usar uno de tus horarios
          </span>
          <div className="chips">
            {franjas.map((f) => (
              <Chip key={f.id_disponibilidad} onClick={() => usarFranja(f)}>
                {capitalizar(f.dia_semana)} {f.hora_inicio}–{f.hora_fin}
              </Chip>
            ))}
          </div>
        </div>
      )}

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
          <CalendarCheck size={17} /> {enviando ? 'Programando…' : 'Aceptar y programar'}
        </button>
        {onCancelar && (
          <button type="button" className="btn btn-fantasma" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
