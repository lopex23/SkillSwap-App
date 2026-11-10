import { Check, X } from 'lucide-react';

// Línea de tiempo del estado de una solicitud:
// Enviada → Tutor asignado → Sesión completada (o Cancelada)
export default function LineaSolicitud({ solicitud }) {
  const sesion = solicitud.sesion;
  const cancelada = solicitud.estado === 'cancelada';
  const asignada = Boolean(sesion) && sesion.estado !== 'cancelada' && !cancelada;
  const completada = sesion?.estado === 'completada';

  const pasos = [
    { texto: 'Enviada', estado: 'hecho' },
    cancelada
      ? { texto: 'Cancelada', estado: 'cancelado' }
      : { texto: 'Tutor asignado', estado: asignada ? 'hecho' : '' },
    { texto: 'Sesión completada', estado: completada ? 'hecho' : '' },
  ];

  return (
    <ol className="linea-tiempo" aria-label="Estado de la solicitud">
      {pasos.map((p) => (
        <li key={p.texto} className={p.estado}>
          <span className="linea-paso" aria-hidden="true">
            {p.estado === 'hecho' && <Check size={14} strokeWidth={3} />}
            {p.estado === 'cancelado' && <X size={14} strokeWidth={3} />}
          </span>
          {p.texto}
        </li>
      ))}
    </ol>
  );
}
